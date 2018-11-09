math.randomseed(10000 * require('socket').gettime())


-- Built-in libraries

network = require 'network'
require = require 'require'
local root = require 'portal'
splash = require 'splash'


-- Forward `print` and errors to JS

local cjson = require 'cjson'

do
    local oldPrint = print
    function print(...)
        oldPrint(...)
        love.thread.getChannel('PRINT'):push(cjson.encode({ ... }))
    end
end

function DEFAULT_ERROR_HANDLER(err, stack) -- Referenced in 'network.lua'
    love.thread.getChannel('ERROR'):push(cjson.encode({ error = err, stacktrace = stack }))
end

function root.onError(err, portal, stack)
    DEFAULT_ERROR_HANDLER(err, stack)
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
            if love.system.getOS() ~= 'Windows' -- Failed `0.0.0.0` requests hang on Windows...
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

function main.update(dt)
    network.update(dt)

    if home then
        home:update(dt)
    else
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
    else
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

function main.keypressed(key, ...)
    -- F12: reload home
    if key == 'f12' then
        if homeUrl then
            network.async(function()
                network.flush()
                home = root:newChild(home.path)
            end)
        end
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

for k in pairs({
    load = true,
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

