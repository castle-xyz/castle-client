-- Manage loading, lifetime management and event forwarding for entries

-- The root `_G`
local GG = _G

-- Listing of Love callbacks. Keep in sync with https://love2d.org/wiki/love#Callbacks.
local loveCallbacks = {
    directorydropped = true,
    draw = true,
    -- Skip these and just use the default error handler everywhere
    --    errhand = true,
    --    errorhandler = true,
    filedropped = true,
    focus = true,
    keypressed = true,
    keyreleased = true,
    lowmemory = true,
    mousefocus = true,
    mousemoved = true,
    mousepressed = true,
    mousereleased = true,
    quit = true,
    resize = true,
    --    run = true,
    textedited = true,
    textinput = true,
    threaderror = true,
    touchmoved = true,
    touchpressed = true,
    touchreleased = true,
    update = true,
    visible = true,
    wheelmoved = true,
    gamepadaxis = true,
    gamepadpressed = true,
    gamepadreleased = true,
    joystickadded = true,
    joystickaxis = true,
    joystickhat = true,
    joystickpressed = true,
    joystickreleased = true,
    joystickremoved = true,
}

-- Metatable of portal instances
local portalMeta = {}

-- Set up `love` global for a portal. Various scoping and network fixes.
function portalMeta:setupLove()
    local basePath = self.basePath

    local love = love
    local newLove = {}
    self.globals.love = newLove

    -- Whitelisted top-level functions
    newLove.getVersion = love.getVersion
    newLove.hasDeprecationOutput = love.hasDeprecationOutput
    newLove.setDeprecationOutput = love.setDeprecationOutput

    -- Make all sub-libraries new tables that inherit from the originals
    for k, v in pairs(love) do
        if type(v) == 'table' then
            newLove[k] = setmetatable({}, { __index = love[k] })
        end
    end

    -- Libraries to remove
    newLove.event = nil

    -- Fetch asset contents as string
    local function fetchAsset(path)
        local absolute = network.isAbsolute(path) and path or (self.basePath .. '/' .. path)
        local response = network.fetch(absolute)
        return response
    end

    -- Fetch as `FileData`
    local function fetchFileData(path)
        return love.filesystem.newFileData(fetchAsset(path), path)
    end

    if newLove.window then -- Unavailable in non-main thread
        function newLove.window.setMode() end
    end

    function newLove.filesystem.load(path)
        return function()
            return self.globals.require(path, { saveCache = false })
        end
    end

    function newLove.filesystem.lines(path)
        return fetchAsset(path):gmatch("[^\r\n]+")
    end

    if newLove.graphics then -- Unavailable in non-main thread
        function newLove.graphics.newFont(...)
            local nArgs = select('#', ...)
            if nArgs == 0 then return love.graphics.newFont() end
            local path = select(1, ...)
            local size = select(2, ...)
            if type(path) == 'string' then
                return love.graphics.newFont(love.font.newRasterizer(fetchFileData(path), size))
            elseif nArgs == 1 then -- Need to do it this way for some reason...
                return love.graphics.newFont(path)
            else
                return love.graphics.newFont(path, ...)
            end
        end

        function newLove.graphics.setNewFont(...)
            newLove.graphics.setFont(newLove.graphics.newFont(...))
        end

        function newLove.graphics.newImage(path, ...)
            if type(path) == 'string' then
                return love.graphics.newImage(love.image.newImageData(fetchFileData(path)))
            else
                return love.graphics.newImage(path, ...)
            end
        end

        function newLove.graphics.newImageFont(path, ...)
            if type(path) == 'string' then
                return love.graphics.newImageFont(love.image.newImageData(fetchFileData(path)), ...)
            else
                return love.graphics.newImageFont(path, ...)
            end
        end

        function newLove.graphics.newShader(path, ...)
            if type(path) == 'string' and not path:match('\n') then
                return love.graphics.newShader(fetchFileData(path), ...)
            else
                return love.graphics.newShader(path, ...)
            end
        end
    end

    if newLove.window then
        function newLove.window.setFullscreen()
            return false
        end
    end

    function newLove.image.newImageData(path, ...)
        if type(path) == 'string' then
            return love.image.newImageData(fetchFileData(path))
        else
            return love.image.newImageData(path, ...)
        end
    end

    if newLove.audio then
        function newLove.audio.newSource(path, ...)
            if type(path) == 'string' then
                return love.audio.newSource(fetchFileData(path), ...)
            else
                return love.audio.newSource(path, ...)
            end
        end
    end

    function newLove.thread.newThread(s)
        -- See https://github.com/love2d-community/love-api/blob/ca6cae9b4fa21a450f28f52e18dd949693b20862/modules/thread/Thread.lua#L90
        local code
        if #s >= 1024 or s:find('\n') then
            code = s
        else
            code = fetchAsset(s)
        end

        -- Wrap with our bootstrapping, also explicitly load `love.` modules we wrap since those
        -- aren't automatically loaded in a new thread
        local pathLit = ('%q'):format(self.basePath):gsub('\010', 'n'):gsub('\026', '\\026')
        code = [[
            require 'love.audio'
            require 'love.filesystem'
            require 'love.image'
            require 'love.timer'

            network = require 'network'
            REQUIRE_BASE_PATH = ]] .. pathLit .. [[
            require = require 'require'

            portal = require 'portal'
            portal.basePath = REQUIRE_BASE_PATH
            portal:setupLove()
            love = portal.globals.love

            copas = require 'copas'
            copas.addthread(function(...) ]] .. code .. [[ end, ...)
            copas.loop()
        ]]
        return love.thread.newThread(code)
    end
end

-- Call `foo` in protected mode, calling `self:handleError` on an error if one
-- occurs. If the call to `foo` succeeded, returns `true` followed by its return
-- values. If an error occured, returns `false` and the error message.
function portalMeta:safeCall(foo, ...)
    return xpcall(foo, function(err) self:handleError(err) end, ...)
end

-- Handle an error `err` occurring in the context of this portal. Calls
-- `self.onError`, cascading to parents if that doesn't exist or raises an error
-- itself
function portalMeta:handleError(err)
    local stack = debug.traceback(err, 2)
    local boundary = self
    local succeeded
    repeat
        -- Find closest ancestor (possibly `self`) with `.onError`
        while boundary and not boundary.onError do
            boundary = boundary.parent
        end
        if not boundary then error(err, 0) end

        -- Protect call to error handler, move upward if it failed
        succeeded, err = pcall(boundary.onError, err, self, stack)
        if not succeeded then boundary = boundary.parent end
    until succeeded
end

-- Create a basic unpopulated portal instance
local function createInstance()
    return setmetatable({}, { __index = portalMeta })
end

-- Load a portal to given `require`-able `path`
function portalMeta:newChild(path, args)
    -- Create the portal instance
    local child = createInstance()
    child.parent = self
    child.args = args or {}
    child.path = path
    child.onError = child.args.onError

    -- Figure out base path
    if network.isAbsolute(path) then
        child.basePath = path:gsub('(.*)/(.*)', '%1')
    else
        child.basePath = self.basePath
    end

    -- Create a new globals table `__index`ing to the base one
    child.globals = setmetatable({}, { __index = GG })
    child.globals.portal = child

    -- Make a copy of the `package` table that resets the loaded modules
    child.globals.package = setmetatable({}, { __index = package })
    child.globals.package.loaded = {}

    -- Set up the `love` global
    child:setupLove()

    -- Copy in `extraGlobals` if given
    if child.args.extraGlobals then
        for k, v in pairs(child.args.extraGlobals) do
            child.globals[k] = v
        end
    end

    -- `require` it!
    local succeeded, err = child:safeCall(function()
        self.globals.require(path, {
            parentEnv = self.globals,
            childEnv = child.globals,
            saveCache = false, -- Always reload portals
            -- Add a preamble that loads 'conf.lua' often present alongside 'main.lua':
            -- https://love2d.org/wiki/Config_Files
            -- The associated `love.conf(...)` is ignored, but 'conf.lua' may have some other side
            -- effects that matter (eg., setting some global variables).
            preamble = child.args.noConf and '' or [[
                pcall(require, 'conf')
            ]],
        })
    end)
    if err then
        print(err)
    end
    if not succeeded then return nil, err end

    -- Call `love.load` callback and set as loaded
    if child.globals.love.load then
        child.globals.love.load({ child.basePath })
    end
    child.loaded = true

    return child
end

-- Add all of the callbacks as methods
for cbName in pairs(loveCallbacks) do
    portalMeta[cbName] = function(self, ...)
        local found = self.globals.love[cbName]
        if found then self:safeCall(found, ...) end
    end
end

-- Override the `draw` method to scope graphics state changes to the portal
function portalMeta:draw()
    love.graphics.push('all')
    if self.globals.love.draw then
        self:safeCall(self.globals.love.draw)
    end
    love.graphics.pop()
end

-- Return a root portal instance
local root = createInstance()
root.globals = setmetatable({}, { __index = GG })
root.loaded = true
root.path = 'root'
return root
