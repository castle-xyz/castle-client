local system = require 'love.system'

function love.conf(t)
    t.identity = 'Castle'

    local theOS = system.getOS()
    local mobile = theOS == 'iOS' or theOS == 'Android'

    t.window.title = 'castle-player'
    t.window.msaa = 0
    t.window.highdpi = true

    if not mobile then
        t.window.borderless = true
        t.window.width = 640
        t.window.height = 480
        t.window.resizable = false
    end
end
