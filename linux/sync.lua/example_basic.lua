-- Tutorial on this at https://github.com/expo/sync.lua/blob/master/docs/tutorial_basic.md


local sync = require 'sync'


local Player = sync.registerType('Player')

function Player:didSpawn()
    self.x, self.y = love.graphics.getWidth() * math.random(), love.graphics.getHeight() * math.random()
    self.r, self.g, self.b = 0.2 + 0.8 * math.random(), 0.2 + 0.8 * math.random(), 0.2 + 0.8 * math.random()
    self.vx, self.vy = 0, 0
end

function Player:update(dt)
    self.x = self.x + self.vx * dt
    self.y = self.y + self.vy * dt
    self.__mgr:sync(self)
end

function Player:draw(isOwn)
    love.graphics.push('all')
    love.graphics.setColor(self.r, self.g, self.b)
    love.graphics.ellipse('fill', self.x, self.y, 40, 40)
    if isOwn then
        love.graphics.setColor(1, 1, 1)
        love.graphics.setLineWidth(5)
        love.graphics.ellipse('line', self.x, self.y, 48, 48)
    end
    love.graphics.pop()
end

function Player:setWalkState(up, down, left, right)
    self.vx, self.vy = 0, 0
    if up then self.vy = self.vy - 240 end
    if down then self.vy = self.vy + 240 end
    if left then self.vx = self.vx - 240 end
    if right then self.vx = self.vx + 240 end
end


local Controller = sync.registerType('Controller')

function Controller:didSpawn()
    self.playerId = self.__mgr:spawn('Player')
end

function Controller:willDespawn()
    self.__mgr:despawn(self.playerId)
end

function Controller:setWalkState(up, down, left, right)
    self.__mgr:byId(self.playerId):setWalkState(up, down, left, right)
end


local server, client

local function keyEvent(key)
    if client and client.controller then
        if key == 'up' or key == 'down' or key == 'left' or key == 'right' then
            client.controller:setWalkState(
                love.keyboard.isDown('up'),
                love.keyboard.isDown('down'),
                love.keyboard.isDown('left'),
                love.keyboard.isDown('right'))
        end
    end
end

function love.load()
    if CASTLE_SERVER then
        print("SERVER")
        server = sync.newServer { address = '*:22122', controllerTypeName = 'Controller' }
    end
end

function love.keypressed(key)
    if key == '1' then
        server = sync.newServer { address = '*:22122', controllerTypeName = 'Controller' }
    end
    if key == '2' then
        client = sync.newClient { address = 'localhost:22122' }
    end

    keyEvent(key)
end

function love.keyreleased(key)
    keyEvent(key)
end

function love.update(dt)
    if server then
        for _, ent in pairs(server.all) do
            if ent.update then
                ent:update(dt)
            end
        end
    end
    if server then
        server:process()
    end
    if client then
        client:process()
    end
end

function love.draw()
    if client and client.controller then
        for _, ent in pairs(client.all) do
            if ent.__typeName == 'Player' then
                ent:draw(ent.__id == client.controller.playerId)
            elseif ent.draw then
                ent:draw()
            end
        end
    else
        love.graphics.print('not connected', 20, 20)
    end
end

