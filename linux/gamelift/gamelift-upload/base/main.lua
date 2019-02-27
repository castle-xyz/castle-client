local ffi = require 'ffi'
local C = ffi.C

math.randomseed(10000 * require('socket').gettime())

local theOS = love.system.getOS()
local isMobile = theOS == 'Android' or theOS == 'iOS'


-- Built-in libraries

network = require 'network'
require = require 'require'
castle = require 'castle'
local root = require 'portal'
local jsEvents = require 'jsEvents'

if not CASTLE_SERVER then
    splash = require 'splash'
end


-- Forward `print` and errors to JS, write them to '.log' files on desktop

local updateLogs
do
    local cjson = require 'cjson'

    local ERRORS_FILE_NAME, PRINTS_FILE_NAME = 'castle_errors.log', 'castle_prints.log'

    love.filesystem.write(ERRORS_FILE_NAME, '')
    love.filesystem.write(PRINTS_FILE_NAME, '')

    local collectedPrints = {} -- Stash prints and flush them to the '.log' file once in a while
    local oldPrint = print -- Save original print function to call later
    function print(...)
        oldPrint(...)
        local json = cjson.encode({ ... })
        love.thread.getChannel('PRINT'):push(json)
        if not isMobile then
            collectedPrints[#collectedPrints + 1] = json
        end
    end

    local errors = {}
    function DEFAULT_ERROR_HANDLER(err, stack) -- Referenced in 'network.lua'
        oldPrint(stack)
        local json = cjson.encode({ error = err, stacktrace = stack })
        love.thread.getChannel('ERROR'):push(json)
        love.filesystem.append(ERRORS_FILE_NAME, json .. '\n')
    end

    function root.onError(err, portal, stack)
        DEFAULT_ERROR_HANDLER(err, stack)
    end

    local lastPrintDumpTime
    function updateLogs(isQuitting)
        -- Flush stashed prints to '.log' file once in a while
        if not isMobile then
            local now = love.timer.getTime()
            if isQuitting or not lastPrintDumpTime or now - lastPrintDumpTime > 0.5 then
                lastPrintDumpTime = now
                if #collectedPrints > 0 then
                    love.filesystem.append(PRINTS_FILE_NAME,
                        table.concat(collectedPrints, '\n') .. '\n')
                    collectedPrints = {}
                end
            end
        end
    end
end


-- Top-level Love callbacks

local initialFileDropped -- In case a `love.filedropped` occurred before home experience is loaded

local homeUrl -- Populated later with the final home experience URL
local remoteHomeVersion = 'e0909a90e9d04a895531cd1013bdb39c9b18cdc4' -- Git specifier of remote home
local localHomeUrl = 'http://0.0.0.0:8032/main.lua' -- URL to local home to attempt

local home -- Portal to the home experience

local main = {}

function main.load(arg)
    network.async(function()
        if GHOST_ROOT_URI then -- Global `GHOST_ROOT_URI` set by native code? Just use that.
            homeUrl = GHOST_ROOT_URI
        else -- Default to remote URI based on `remoteHomeVersion`, using local version if served
            homeUrl = 'https://raw.githubusercontent.com/nikki93/ghost-home2/'
                    .. remoteHomeVersion .. '/main.lua'
            if theOS ~= 'Windows' -- Failed `0.0.0.0` requests hang on Windows...
                    and network.exists(localHomeUrl) then
                homeUrl = localHomeUrl
            end
        end

        home = root:newChild(homeUrl, { noConf = true })
        if initialFileDropped then
            home:filedropped(initialFileDropped)
            initialFileDropped = nil
        end
    end)
end

ffi.cdef 'bool ghostGetBackgrounded();'

function main.update(dt)
    network.update(dt)

    jsEvents.update()

    updateLogs()

    if home then
        if not isMobile and C.ghostGetBackgrounded() then -- FFI `ghost*` calls are desktop-only
            if home.globals.castle.backgroundupdate then
                home:safeCall(home.globals.castle.backgroundupdate, dt)
            end
        else
            home:update(dt)
        end
    elseif not CASTLE_SERVER then
        splash:update(dt)
    end
end

local debugFont
if love.graphics then
    debugFont = love.graphics.newFont(12)
end

function main.draw()
    if home then
        home:draw()
    elseif not CASTLE_SERVER then
        splash:draw()
    end

    do -- Debug overlay
        love.graphics.push('all')
        love.graphics.setFont(debugFont)
        love.graphics.setColor(0.969, 0.816, 0)
        -- Ongoing network requests on bottom of screen
        local fontH = love.graphics.getFont():getHeight()
        local yStep = 1.2 * fontH
        local y = love.graphics.getHeight()
        for _, req in ipairs(network.requests) do
            y = y - yStep
            local ms = math.floor(1000 * req.time)
            love.graphics.print(req.url .. '    ' .. req.method .. '     ' .. tostring(ms),
                yStep - fontH + 4, y)
        end
        love.graphics.pop('all')
    end
end

local copas = require 'copas'

local function softReload()
    if home then
        -- Iterate over modules loaded in `home` asynchronously
        local urls = {} -- Map of `url` to `'waiting'`, `'reload'` or `'done'`
        local mainCoroutine = coroutine.running()
        for url in pairs(home.globals.package.loaded) do
            -- Make sure it's located under `home`'s base URL
            if url:sub(1, #home.basePath) == home.basePath then
                urls[url] = 'waiting'
                network.async(function()
                    -- Find the old and new 'Last-Modified' HTTP HEAD values
                    local before, after
                    do
                        local _, _, headers = network.fetch(url, 'HEAD')
                        before = headers['last-modified']
                    end
                    network.fetchEntries.HEAD[url] = nil -- Flush from HTTP HEAD cache
                    do
                        local _, _, headers = network.fetch(url, 'HEAD')
                        after = headers['last-modified']
                    end
                    -- If they are different, we need to reload!
                    if before ~= after then
                        urls[url] = 'reload'
                        home.globals.package.loaded[url] = nil -- Flush from module cache
                        network.fetchEntries.GET[url] = nil -- Flush from HTTP GET cache
                    else
                        urls[url] = 'done'
                    end
                    copas.wakeup(mainCoroutine)
                end)
            end
        end
        -- Wait until none of the `urls` are in `'waiting'` state
        while true do
            local anyWaiting = false
            for _, state in pairs(urls) do
                if state == 'waiting' then
                    anyWaiting = true
                    break
                end
            end
            if anyWaiting then
                copas.sleep(-1)
            else
                break
            end
        end
        -- Reload the modules using the `home`'s `require`
        for url, state in pairs(urls) do
            if state == 'reload' then
                home.globals.require(url:sub(#home.basePath + 1):gsub('^/*', ''))
            end
        end
    end
end

function main.keypressed(key, ...)
    -- Intercept system hotkeys
    if not isMobile then
        local ctrl = love.keyboard.isDown('lctrl') or love.keyboard.isDown('rctrl')
        local gui = love.keyboard.isDown('lgui') or love.keyboard.isDown('rgui')
        local shift = love.keyboard.isDown('lshift') or love.keyboard.isDown('rshift')
        if (ctrl or gui or shift) and (key == 'j' or key == 'o' or key == 'r' or key == 'f') then
            jsEvents.send('CASTLE_SYSTEM_KEY_PRESSED', {
                ctrlKey = ctrl,
                altKey = false,
                metaKey = gui,
                shiftKey = shift,
                key = key,
            })
            return
        end
    end

    -- F12: Soft-reload
    if key == 'f12' then
        network.async(function()
            softReload()
        end)
        return
    end

    if home then
        home:keypressed(key, ...)
    end
end

function main.filedropped(file)
    if home then
        home:filedropped(file)
    else
        initialFileDropped = file
    end
end

function main.mousemoved(...)
    love.thread.getChannel('FOCUS_ME'):push('PLEASE')
    if home then
        home:mousemoved(...)
    end
end

function main.quit(...)
    updateLogs(true)

    if home then
        home:quit(...)
    end
end

for k in pairs({
    load = true,
    quit = true,
    update = true,
    draw = true,
    keypressed = true,
    keyreleased = true,
    mousefocus = true,
    mousemoved = true,
    mousepressed = true,
    mousereleased = true,
    resize = true,
    textedited = true,
    textinput = true,
    touchmoved = true,
    touchpressed = true,
    touchreleased = true,
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
    focus = true,
    filedropped = true,
    visible = true,
}) do
    love[k] = function(...)
        if main[k] then
            main[k](...)
        else -- Default behavior if we didn't define it in `main`
            if home and home[k] then
                home[k](home, ...)
            end
        end
    end
end

