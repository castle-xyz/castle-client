local sync = require 'sync'

local shash = require 'https://raw.githubusercontent.com/rxi/shash/7e2bbef0193e986bb4e655e18c4e23123e7081d8/shash.lua'



-- 'Globals'

local SERVER_ADDRESS = '207.254.45.246'

local WORLD_MULT = 2
local WORLD_SIZE = WORLD_MULT * 500
local WORLD_NUM_STUFFS = WORLD_MULT * WORLD_MULT * 5000
local WORLD_SCALE = 1 -- Update later based on window size
local DISPLAY_SIZE = 20 -- How many world units wide should we able to see?
local MINIMAP_SIZE = 64


-- Utilities

-- `love.graphics.stacked([arg], func)` calls `func` between `love.graphics.push([arg])` and
-- `love.graphics.pop()` while being resilient to errors
function love.graphics.stacked(argOrFunc, funcOrNil)
    love.graphics.push(funcOrNil and argOrFunc)
    local succeeded, err = pcall(funcOrNil or argOrFunc)
    love.graphics.pop()
    if not succeeded then
        error(err, 0)
    end
end



-- World

local World = sync.registerType('World')

function World:didSpawn()
    for i = 1, WORLD_NUM_STUFFS do
        self.__mgr:spawn(
            'Stuff',
            WORLD_SIZE * (0.5 - math.random()),
            WORLD_SIZE * (0.5 - math.random()))
    end
    self.numStuffs = WORLD_NUM_STUFFS
    print('world ready')
end

function World:didEnter()
    World.instance = self
end



-- Stuff

local Stuff = sync.registerType('Stuff')

Stuff.shash = shash.new(DISPLAY_SIZE)

function Stuff:didSpawn(x, y)
    self.x, self.y = x, y
    self.angle = 2 * math.pi * math.random()
    self.rotSpeed = 0.1 * 2 * math.pi * math.random()
    self.width, self.height = 1 + 10 * math.random(), 1 + 10 * math.random()
    self.r, self.g, self.b = 0.1 + 0.7 * math.random(), 0.2 * math.random(), 0.2 + 0.5 * math.random()
    local dia = math.sqrt(self.width * self.width + self.height * self.height)
    Stuff.shash:add(self, self.x - 0.5 * dia, self.y - 0.5 * dia, dia, dia)
end

function Stuff:didDespawn()
    Stuff.shash:remove(self)
end

function Stuff.getRelevants(controller)
    local player = controller.__mgr:byId(controller.playerId)
    local ids = {}
    Stuff.shash:each(
        player.x - 0.5 * DISPLAY_SIZE, player.y - 0.5 * DISPLAY_SIZE, DISPLAY_SIZE, DISPLAY_SIZE,
        function(stuff) ids[stuff.__id] = true end)
    return ids
end

function Stuff:update(dt)
    self.angle = self.angle + self.rotSpeed * dt
    self.__mgr:sync(self)
end

function Stuff:draw()
    love.graphics.stacked('all', function()
        love.graphics.translate(self.x, self.y)
        love.graphics.rotate(self.angle)
        love.graphics.setColor(self.r, self.g, self.b)
        love.graphics.rectangle('fill',
            -0.5 * self.width, -0.5 * self.height,
            self.width, self.height)
    end)
end



-- Player

local Player = sync.registerType('Player')

Player.DAMPING = 1.5
Player.DAMPING_BASE = math.pow(1 - Player.DAMPING / 60, 60)

function Player:didSpawn()
    self.x, self.y = 0, 0
    self.vx, self.vy = 0, 0
    self.ax, self.ay = 0, 0
end

function Player:update(dt)
    self.vx, self.vy = self.vx + self.ax * dt, self.vy + self.ay * dt
    local d = math.pow(Player.DAMPING_BASE, dt)
    self.vx, self.vy = d * self.vx, d * self.vy

    self.x, self.y = self.x + self.vx * dt, self.y + self.vy * dt
    self.__mgr:sync(self)
end

function Player:setAcceleration(ax, ay)
    self.ax, self.ay = ax, ay
end



-- Controller

local Controller = sync.registerType('Controller')

function Controller:didSpawn()
    self.playerId = self.__mgr:spawn('Player')
end

function Controller:willDespawn()
    self.__mgr:despawn(self.playerId)
end

function Controller:setAcceleration(ax, ay)
    self.__mgr:byId(self.playerId):setAcceleration(ax, ay)
end



-- Server / client instances and top-level Love callbacks

local server, client


function love.update(dt)
    local ww, wh = love.graphics.getDimensions()
    WORLD_SCALE = math.max(ww, wh) / DISPLAY_SIZE

    if server then
        server:process()

        for _, ent in pairs(server.all) do
            if ent.update then
                ent:update(dt)
            end
        end
    end
    if client then
        client:process()
    end
end


local function setAccelerationFromMouse()
    local x, y = love.mouse.getPosition()
    local ww, wh = love.graphics.getDimensions()
    local md = math.min(ww, wh)
    local dx, dy = x - 0.5 * ww, y - 0.5 * wh
    client.controller:setAcceleration(28 * dx / md, 28 * dy / md)
end

function love.mousepressed()
    if not client then
        client = sync.newClient { address = SERVER_ADDRESS .. ':22124' }
    end

    if client and client.controller then
        setAccelerationFromMouse()
    end
end

function love.mousemoved()
    if client and client.controller then
        if love.mouse.isDown(1) then
            setAccelerationFromMouse()
        end
    end
end

function love.mousereleased()
    if client and client.controller then
        client.controller:setAcceleration(0, 0)
    end
end

function love.keypressed(key)
    if key == '0' then
        server = sync.newServer {
            address = '*:22124',
            controllerTypeName = 'Controller',
        }
        server:spawn('World')
    end
end


local startTime

function love.draw()
    if client and client.controller then
        local numDrawables = 0

        local player = client:byId(client.controller.playerId)

        love.graphics.stacked('all', function()
            local ww, wh = love.graphics.getDimensions()
            love.graphics.translate(ww / 2, wh / 2)

            love.graphics.scale(WORLD_SCALE)

            love.graphics.translate(-player.x, -player.y)

            local order = {}
            for _, ent in pairs(client.all) do
                if ent.draw then
                    table.insert(order, ent)
                    numDrawables = numDrawables + 1
                end
            end
            table.sort(order, function(e1, e2) return e1.__id < e2.__id end)
            for _, ent in ipairs(order) do
                ent:draw()
            end
        end)

        love.graphics.stacked('all', function()
            local mx, my = love.graphics.getWidth() - MINIMAP_SIZE - 20, 20
            love.graphics.setColor(1, 1, 1, 0.4)
            love.graphics.rectangle('fill', mx, my, MINIMAP_SIZE, MINIMAP_SIZE)
            love.graphics.setColor(0.2, 0.2, 0.2, 1)
            love.graphics.setLineWidth(3)
            love.graphics.rectangle('line', mx, my, MINIMAP_SIZE, MINIMAP_SIZE)
            for id, ent in pairs(client.allPerType.Player) do
                local px = mx + 0.5 * MINIMAP_SIZE + MINIMAP_SIZE * ent.x / WORLD_SIZE
                local py = my + 0.5 * MINIMAP_SIZE + MINIMAP_SIZE * ent.y / WORLD_SIZE
                if id == player.__id then
                    love.graphics.setColor(0, 1, 0, 1)
                else
                    love.graphics.setColor(1, 0, 0, 1)
                end
                love.graphics.ellipse('fill', px, py, 2, 2)
            end
        end)

        if World.instance then
            love.graphics.print('total: ' .. World.instance.numStuffs, 20, 20)
            love.graphics.print('\nrelevant: ' .. numDrawables, 20, 20)
            love.graphics.print('\n\nping: ' .. client.serverPeer:round_trip_time(), 20, 20)
            local now = love.timer.getTime()
            if not startTime then
                startTime = now - 0.01
            end
            love.graphics.print("\n\n\nkbps dl'd: " ..
                    math.floor(0.001 * client.host:total_received_data() / (now - startTime)), 20, 20)
        end
    else
        love.graphics.print('click / touch to connect', 20, 20)
        love.graphics.print('\npress 0 to start a server', 20, 20)
    end
    love.graphics.print('fps: ' .. love.timer.getFPS(), 20, love.graphics.getHeight() - 32)
end
