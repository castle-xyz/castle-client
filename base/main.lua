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

    if castle.system.isDesktop() then
        love.filesystem.write(ERRORS_FILE_NAME, '')
        love.filesystem.write(PRINTS_FILE_NAME, '')
    end

    local collectedPrints = {} -- Stash prints and flush them to the '.log' file once in a while
    local oldPrint = print -- Save original print function to call later
    function print(...)
        oldPrint(...)
        local array = { ... }
        if castle.system.isDesktop() then
            jsEvents.send('GHOST_PRINT', array)
            collectedPrints[#collectedPrints + 1] = cjson.encode(array)
        else
            love.thread.getChannel('PRINT'):push(cjson.encode(array))
        end
    end

    local errors = {}
    function DEFAULT_ERROR_HANDLER(err, stack) -- Referenced in 'network.lua'
        oldPrint(stack)
        local obj = { error = err, stacktrace = stack }
        if castle.system.isDesktop() then
            jsEvents.send('GHOST_ERROR', obj)
            love.filesystem.append(ERRORS_FILE_NAME, cjson.encode(obj) .. '\n')
        else
            love.thread.getChannel('ERROR'):push(cjson.encode(obj))
        end
    end

    function root.onError(err, portal, stack)
        DEFAULT_ERROR_HANDLER(err, stack)
    end

    local lastPrintDumpTime
    function updateLogs(isQuitting)
        -- Flush stashed prints to '.log' file once in a while
        if castle.system.isDesktop() then
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
        if castle.system.isDesktop() and C.ghostGetBackgrounded() then
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
    debugFont = love.graphics.newFont('assets/fonts/SFMono-Bold.otf', 12)
end

function main.draw()
    if home and home.loaded then
        home:draw()
    elseif not CASTLE_SERVER then
        splash:draw()
    end

    do -- Debug overlay
        love.graphics.push('all')
        love.graphics.setFont(debugFont)
        love.graphics.setColor(1, 0, 1)
        -- Ongoing network requests on bottom of screen
        local fontH = love.graphics.getFont():getHeight()
        local X_PADDING = 16
        local Y_PADDING = 14
        local y = love.graphics.getHeight() - Y_PADDING
        for _, req in ipairs(network.requests) do
            local paddedMethod = req.method .. string.rep(' ', math.max(4 - #req.method, 0))
            local ms = tostring(math.floor(1000 * req.time))
            local paddedMs = ms .. string.rep(' ', math.max(4 - #ms, 0))
            love.graphics.print(paddedMs .. '   ' .. paddedMethod .. '   ' .. req.url, X_PADDING, y - fontH)
            y = y - fontH - 4
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
    if castle.system.isDesktop() then
        local ctrl = love.keyboard.isDown('lctrl') or love.keyboard.isDown('rctrl')
        local gui = love.keyboard.isDown('lgui') or love.keyboard.isDown('rgui')
        local shift = love.keyboard.isDown('lshift') or love.keyboard.isDown('rshift')
        if (key == 'escape') or ((ctrl or gui or shift) and (key == 'j' or key == 'r' or key == 'f' or key == 'w' or key == 'x')) then
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

function main.mousepressed(...)
    love.thread.getChannel('FOCUS_ME'):clear()
    love.thread.getChannel('FOCUS_ME'):push('PLEASE')
    if home then
        home:mousepressed(...)
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

-- Based on default in https://love2d.org/wiki/love.run with Ghost adjustments
function love.run()
    if love.load then love.load(love.arg.parseGameArguments(arg), arg) end

    -- We don't want the first frame's dt to include time taken by love.load.
    if love.timer then love.timer.step() end

    local dt = 0

    -- Main loop time.
    return function()
        -- Process events.
        if love.event then
            love.event.pump()
            for name, a,b,c,d,e,f in love.event.poll() do
                if name == "quit" then
                    if not love.quit or not love.quit() then
                        return a or 0
                    end
                end
                love.handlers[name](a,b,c,d,e,f)
            end
        end

        -- Update dt, as we'll be passing it to update
        if love.timer then dt = love.timer.step() end

        -- Call update and draw
        if love.update then love.update(dt) end -- will pass 0 if love.timer is disabled

        if love.graphics and love.graphics.isActive() then
            love.graphics.origin()
            love.graphics.clear(love.graphics.getBackgroundColor())

            if love.draw then love.draw() end

            love.graphics.present()
        elseif not CASTLE_SERVER then -- XXX(Ghost): Limit framerate when not drawing
            love.timer.sleep(0.016)
        end

        if love.timer then love.timer.sleep(0.001) end
    end
end