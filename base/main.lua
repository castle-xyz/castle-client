local ffi = require 'ffi'
local C = ffi.C
local cjson = require 'cjson'
local copas = require 'copas'


math.randomseed(10000 * require('socket').gettime())

local theOS = love.system.getOS()
local isMobile = theOS == 'Android' or theOS == 'iOS'


-- Consume initial data

do
    local channel = love.thread.getChannel('INITIAL_DATA')
    if channel:getCount() > 0 then
        pcall(function()
            CASTLE_INITIAL_DATA = cjson.decode(channel:pop())
        end)
        channel:clear()
    end
end


-- Make a directory for temporary files

CASTLE_TMP_DIR_NAME = 'tmp'
love.filesystem.createDirectory(CASTLE_TMP_DIR_NAME)
for _, filename in pairs(love.filesystem.getDirectoryItems(CASTLE_TMP_DIR_NAME)) do
    love.filesystem.remove(CASTLE_TMP_DIR_NAME .. '/' .. filename)
end


-- We need to maintain modifier key state ourselves because if SDL is quit when a modifier is held down,
-- it keeps thinking the key is held down when SDL is next initialized even if the key was released in
-- between (seems maybe a Windows-only issue?)... :/

CASTLE_MODIFIER_KEYS = {
    rshift = false,
    lshift = false,
    rctrl = false,
    lctrl = false,
    ralt = false,
    lalt = false,
    rgui = false,
    lgui = false,
}

do
    local oldKeyboardIsDown = love.keyboard.isDown
    function love.keyboard.isDown(key)
        if CASTLE_MODIFIER_KEYS[key] ~= nil then
            return CASTLE_MODIFIER_KEYS[key]
        else
            return oldKeyboardIsDown(key)
        end
    end
end


-- Built-in libraries

network = require 'network'
require = require 'require'
castle = require 'castle'
local root = require 'portal'
local jsEvents = require 'jsEvents'


-- Forward `print` and errors to JS, write them to '.log' files on desktop

local updateLogs
do
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
        for chunkName, filename in pairs(CHUNK_NAME_TO_FILE_NAME) do
            local pattern = '%[string "' .. chunkName .. '"%]'
            err = err:gsub(pattern, filename)
            stack = stack:gsub(pattern, filename)
        end
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


-- Mobile keyboard event handling

local updateMobileKeyboardEvents
if isMobile then
    local isKeyDown = {}

    function updateMobileKeyboardEvents()
        local pressed = love.thread.getChannel('GHOST_MOBILE_KEY_PRESSED')
        local released = love.thread.getChannel('GHOST_MOBILE_KEY_RELEASED')
        while pressed:getCount() > 0 do
            local k = pressed:pop()
            isKeyDown[k] = true
            love.keypressed(k)
        end
        while released:getCount() > 0 do
            local k = released:pop()
            isKeyDown[k] = nil
            love.keyreleased(k)
        end
    end

    function love.keyboard.isDown(k)
        return isKeyDown[k] ~= nil
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

        if love.graphics then
            -- Sleep a little to let screen dimensions settings synchronize, then create the default
            -- font, so that it has the updated DPI
            copas.sleep(0.08)
            love.graphics.setFont(love.graphics.newFont(14))
        end

        home = root:newChild(homeUrl, { noConf = true })
        jsEvents.send('CASTLE_GAME_LOADED', {})
        io.flush()
        if initialFileDropped then
            home:filedropped(initialFileDropped)
            initialFileDropped = nil
        end
    end)
end

local pendingPostOpens = {} -- Keep track of post open requests
jsEvents.listen('CASTLE_POST_OPENED', function(postOpen)
    table.insert(pendingPostOpens, postOpen)
end)

local pendingJoystickAdds = {} -- Keep track of joystick opens before `home` is ready
function main.joystickadded(joystick)
    if not (home and home.loaded) then
        table.insert(pendingJoystickAdds, joystick)
    end
end

ffi.cdef 'bool ghostGetBackgrounded();'

function main.update(dt)
    if isMobile then
        updateMobileKeyboardEvents()
    end

    network.update(dt)

    jsEvents.update()

    if castle.system.isDesktop() then
        castle.ui.update()
    end

    updateLogs()

    if castle.system.isDesktop() and C.ghostGetBackgrounded() then
        for key in pairs(CASTLE_MODIFIER_KEYS) do
            CASTLE_MODIFIER_KEYS[key] = false
        end
    end

    if home then
        -- If has a `castle.postopened` handler, notify of post opens
        if home.loaded and home.globals.castle.postopened then
            for _, postOpen in ipairs(pendingPostOpens) do
                home:safeCall(home.globals.castle.postopened, castle.post._decodePost(postOpen))
            end
            pendingPostOpens = {}
        end

        -- Notify of joystick adds
        if home.loaded and #pendingJoystickAdds > 0 then
            if home.joystickadded then
                for _, joystick in ipairs(pendingJoystickAdds) do
                    home:joystickadded(joystick)
                end
            end
            pendingJoystickAdds = {}
        end

        if castle.system.isDesktop() and C.ghostGetBackgrounded() then
            if home.globals.castle.backgroundupdate then
                home:safeCall(home.globals.castle.backgroundupdate, dt)
            end
        else
            home:update(dt)
        end
    end
end

function main.draw(...)
    love.graphics.push('all')
    if home then
        home:draw(...)
    end
    love.graphics.pop()
end

ffi.cdef 'bool ghostFocusChat();'

function main.keypressed(key, ...)
    if CASTLE_MODIFIER_KEYS[key] ~= nil then
        CASTLE_MODIFIER_KEYS[key] = true
    end
    local ctrl = CASTLE_MODIFIER_KEYS.lctrl or CASTLE_MODIFIER_KEYS.rctrl
    local gui = CASTLE_MODIFIER_KEYS.lgui or CASTLE_MODIFIER_KEYS.rgui
    local shift = CASTLE_MODIFIER_KEYS.lshift or CASTLE_MODIFIER_KEYS.rshift

    -- Intercept system hotkeys
    if castle.system.isDesktop() then
        if (key == 'escape') or ((ctrl or gui or shift) and (key == 'j' or key == 'r' or key == 'f' or key == 'w' or key == 's')) then
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

    -- Chat focus
    if ctrl and key == 'g' then
        C.ghostFocusChat()
    end

    if home then
        home:keypressed(key, ...)
    end
end

function main.keyreleased(key, ...)
    if CASTLE_MODIFIER_KEYS[key] ~= nil then
        CASTLE_MODIFIER_KEYS[key] = false
    end

    if home then
        home:keyreleased(key, ...)
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

do
    -- Wrap this to account for our own dimensions stuff
    local oldW, oldH
    function main.resize()
        if home and CASTLE_INITIAL_DATA and CASTLE_INITIAL_DATA.graphics.width == 0 then -- Only send resize events in 'full' case
            local w, h = home.globals.love.graphics.getDimensions()
            if w ~= oldW or h ~= oldH then
                home:resize(w, h)
            end
            oldW, oldH = w, h
        end
    end
end

function main.quit(...)
    love.mouse.setRelativeMode(false)
    love.mouse.setGrabbed(false)

    updateLogs(true)

    if home then
        home:quit(...)
    end
end

function castle.uiupdate()
    if home and home.globals.castle.uiupdate and home.globals.castle.uiupdate ~= castle.uiupdate then
        home:safeCall(home.globals.castle.uiupdate)
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

    --- XXX(Ghost): For 60 Hz throttling when headless
    local lastLoopStartTime, lastSleepError

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

        --- XXX(Ghost): 60 Hz throttling when headless
        if not (love.graphics and love.graphics.isActive()) then
            if lastLoopStartTime then
                local sleepTarget = lastLoopStartTime + (1 / 60) - (lastSleepError or 0)
                local sleepDuration = sleepTarget - love.timer.getTime()
                if sleepDuration > 0.001 then
                    love.timer.sleep(sleepDuration)
                end
                local sleepError = love.timer.getTime() - sleepTarget
                if lastSleepError then
                    lastSleepError = 0.5 * lastSleepError + 0.5 * sleepError
                else
                    lastSleepError = sleepError
                end
            end
        end
        lastLoopStartTime = love.timer.getTime()

        -- Call update and draw
        if love.update then love.update(dt) end -- will pass 0 if love.timer is disabled

        if love.graphics and love.graphics.isActive() then
            love.graphics.origin()
            love.graphics.clear(love.graphics.getBackgroundColor())

            if love.draw then love.draw() end

            love.graphics.present()
        end

        if love.timer then love.timer.sleep(0.001) end
    end
end