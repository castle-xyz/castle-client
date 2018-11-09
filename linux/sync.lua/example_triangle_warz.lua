local sync = require 'sync'

-- Moonshine is a post-processing effects library, see https://github.com/nikki93/moonshine
local moonshine = require 'https://raw.githubusercontent.com/nikki93/moonshine/9e04869e3ceaa76c42a69c52a954ea7f6af0469c/init.lua'



-- 'Globals'

local SERVER_ADDRESS = '207.254.45.246'

local W, H = 800, 600 -- Game world size

local MOBILE = love.system.getOS() == 'iOS' or love.system.getOS() == 'Android'

local DISPLAY_SCALE = 1 -- Scale to draw graphics at w.r.t game world units



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



-- Triangle

local Triangle = sync.registerType('Triangle')

local availableTriangleColors = {
    { 0.965, 0.961, 0.682 },
    { 0.961, 0.969, 0.286 },
    { 0.996, 0.373, 0.333 },
    { 0.18, 0.525, 0.671 },
}

function Triangle:didSpawn()
    self.r, self.g, self.b = unpack(table.remove(availableTriangleColors) or
            { 0.2 + 0.8 * math.random(), 0.2 + 0.8 * math.random(), 0.2 + 0.8 * math.random() })
    self.x, self.y = math.random(10, W - 10), math.random(10, H - 10)
    self.vx, self.vy = 0, 0
    self.targetX, self.targetY = math.random(0, W), math.random(0, H) -- Where are we looking?
    self.shootCountdown = 0 -- Seconds till we can shoot again
    self.wantToShoot = false
    self.health = 100
    self.score = 0
end

function Triangle:willDespawn()
    table.insert(availableTriangleColors, { self.r, self.g, self.b })
end

function Triangle:update(dt)
    if self.vx ~= 0 or self.vy ~= 0 then
        self.x = self.x + self.vx * dt
        self.y = self.y + self.vy * dt
        if self.x < 0 then self.x = self.x + W end
        if self.x > W then self.x = self.x - W end
        if self.y < 0 then self.y = self.y + H end
        if self.y > H then self.y = self.y - H end
        self.__mgr:sync(self)
    end

    if self.shootCountdown > 0 then
        self.shootCountdown = self.shootCountdown - dt
    end
    if self.shootCountdown <= 0 and self.wantToShoot then
        self:shoot()
    end

    -- Iterate through `Bullet`s and check for collision
    local nang = -math.atan2(self.targetY - self.y, self.targetX - self.x)
    local sin, cos = math.sin(nang), math.cos(nang)
    for _, ent in pairs(self.__mgr.all) do
        if ent.__typeName == 'Bullet' and ent.ownerId ~= self.__id then
            local dx, dy = ent.x - self.x, ent.y - self.y
            local hitX, hitY
            if dx * dx + dy * dy < 3600 then -- Ignore if far
                for i = -1, 1, 0.2 do -- Check a few points to prevent 'tunneling'
                    local bx, by = ent.x + 18 * i * ent.dirX, ent.y + 18 * i * ent.dirY
                    local dx, dy = bx - self.x, by - self.y
                    local rdx, rdy = dx * cos - dy * sin, dx * sin + dy * cos
                    if rdx > -20 then
                        rdx = rdx + 20
                        rdy = math.abs(rdy)
                        if rdx / 50 + rdy / 20 < 1 then
                            hitX, hitY = bx, by
                            break
                        end
                    end
                end
            end
            if hitX then -- We got shot!
                self.__mgr:despawn(ent)
                self.health = self.health - 5
                if self.health <= 0 then -- We died! Big explosion, respawn, award shooter.
                    self.__mgr:spawn('Explosion', self.x, self.y, self.r, self.g, self.b, true)
                    self.health = 100
                    self.x, self.y = math.random(10, W - 10), math.random(10, H - 10)
                    local shooter = self.__mgr.all[ent.ownerId]
                    if shooter then
                        shooter.score = shooter.score + 1
                        self.__mgr:sync(shooter)
                    end
                else -- Just got shot, didn't die, smaller explosion
                    self.__mgr:spawn('Explosion', hitX, hitY, ent.r, ent.g, ent.b)
                end
                self.__mgr:sync(self)
            end
        end
    end
end

function Triangle:draw(isOwn)
    love.graphics.stacked('all', function()
        love.graphics.translate(self.x, self.y)

        -- Draw triangle, with thicker white outline if it's our own
        love.graphics.stacked('all', function()
            love.graphics.rotate(math.atan2(self.targetY - self.y, self.targetX - self.x))
            love.graphics.setColor(self.r, self.g, self.b)
            love.graphics.polygon('fill', -20, 20, 30, 0, -20, -20)
            love.graphics.setColor(1, 1, 1, 0.8)
            love.graphics.setLineWidth(isOwn and 3 or 1)
            love.graphics.polygon('line', -20, 20, 30, 0, -20, -20)
        end)

        -- Draw health bar
        love.graphics.stacked('all', function()
            love.graphics.setColor(0, 0, 0, 0.5)
            love.graphics.rectangle('fill', -20, -35, 40, 4)
            love.graphics.setColor(0.933, 0.961, 0.859, 0.5)
            love.graphics.rectangle('fill', -20, -35, self.health / 100 * 40, 4)
        end)
    end)
end

function Triangle:setTarget(x, y)
    self.targetX, self.targetY = x, y
    self.__mgr:sync(self)
end

function Triangle:setWantToShoot(wantToShoot)
    self.wantToShoot = wantToShoot
end

function Triangle:shoot()
    if self.shootCountdown <= 0 then
        local dirX, dirY = self.targetX - self.x, self.targetY - self.y
        if dirX == 0 and dirY == 0 then dirX = 1 end -- Prevent division by zero
        local dirLen = math.sqrt(dirX * dirX + dirY * dirY)
        dirX, dirY = dirX / dirLen, dirY / dirLen
        self.__mgr:spawn('Bullet', self.__id,
            self.x + 30 * dirX, self.y + 30 * dirY, dirX, dirY,
            1.5 * self.r, 1.5 * self.g, 1.5 * self.b)
        self.shootCountdown = 0.2
    end
end

function Triangle:setWantToWalk(up, down, left, right)
    self.vx, self.vy = 0, 0
    if left then self.vx = self.vx - 220 end
    if right then self.vx = self.vx + 220 end
    if up then self.vy = self.vy - 220 end
    if down then self.vy = self.vy + 220 end
    local v = math.sqrt(self.vx * self.vx + self.vy * self.vy)
    if v > 0 then -- Limit speed
        self.vx, self.vy = 220 * self.vx / v, 220 * self.vy / v
    end
    self.__mgr:sync(self)
end



-- Bullet

local Bullet = sync.registerType('Bullet')

local bulletSound = love.audio.newSource('example_assets/laser.wav', 'static')

function Bullet:didSpawn(ownerId, x, y, dirX, dirY, r, g, b)
    self.ownerId = ownerId
    self.x, self.y, self.dirX, self.dirY = x, y, dirX, dirY
    self.r, self.g, self.b = r, g, b
    self.lifetime = 1
end

function Bullet:didEnter()
    bulletSound:setPitch(1.4 + 0.3 * math.random())
    bulletSound:stop()
    bulletSound:play()
    self.__local.didPlaySound = true
end

function Bullet:update(dt)
    self.x, self.y = self.x + 800 * self.dirX * dt, self.y + 800 * self.dirY * dt
    if self.x < 0 then self.x = self.x + W end
    if self.x > W then self.x = self.x - W end
    if self.y < 0 then self.y = self.y + H end
    if self.y > H then self.y = self.y - H end
    self.lifetime = self.lifetime - dt
    if self.lifetime <= 0 then
        self.__mgr:despawn(self)
    else
        self.__mgr:sync(self)
    end
end

function Bullet:draw()
    love.graphics.stacked('all', function()
        love.graphics.setColor(self.r, self.g, self.b)
        love.graphics.translate(self.x, self.y)
        love.graphics.rotate(math.atan2(self.dirY, self.dirX))
        love.graphics.ellipse('fill', 0, 0, 24, 1)
        love.graphics.setColor(1, 1, 1, 0.38)
        love.graphics.setLineWidth(0.3)
        love.graphics.ellipse('line', 0, 0, 24, 1)
    end)
end



-- Explosion

local Explosion = sync.registerType('Explosion')

local explosionImage = love.graphics.newImage('example_assets/flare.png')

local smallExplosionSound = love.audio.newSource('example_assets/hurt.wav', 'static')
local bigExplosionSound = love.audio.newSource('example_assets/explosion.wav', 'static')

function Explosion:didSpawn(x, y, r, g, b, isBig)
    self.x, self.y = x, y
    self.r, self.g, self.b = r, g, b
    self.isBig = isBig or false
    self.lifetime = isBig and 4 or 3
end

function Explosion:didEnter()
    self.__local.particles = love.graphics.newParticleSystem(explosionImage, 32)
    self.__local.particles:setColors(1, 1, 1, 1, 1, 1, 1, 0)
    self.__local.particles:setEmitterLifetime(self.lifetime)
    if self.isBig then
        self.__local.particles:setLinearAcceleration(-70, -70, 70, 70)
        self.__local.particles:setParticleLifetime(0.6, 1)
        self.__local.particles:setSizeVariation(0.8)
        self.__local.particles:setSizes(1.6, 0.7, 0)
        self.__local.particles:setEmissionArea('ellipse', 20, 20)
        self.__local.particles:emit(7)
        bigExplosionSound:setPitch(0.7 + 0.3 * math.random())
        bigExplosionSound:stop()
        bigExplosionSound:play()
    else
        self.__local.particles:setLinearAcceleration(-160, -160, 160, 160)
        self.__local.particles:setParticleLifetime(0.3, 0.55)
        self.__local.particles:setSizeVariation(0.4)
        self.__local.particles:setSizes(0.2, 0.08, 0)
        self.__local.particles:setEmissionArea('ellipse', 5, 5)
        self.__local.particles:emit(24)
        smallExplosionSound:setPitch(1.4 + 0.3 * math.random())
        smallExplosionSound:stop()
        smallExplosionSound:play()
    end
end

function Explosion:update(dt)
    if self.__local.particles then
        self.__local.particles:update(dt)
    end
    self.lifetime = self.lifetime - dt
    if self.__mgr.isServer then
        if self.lifetime <= -2 then
            self.__mgr:despawn(self)
        else
            self.__mgr:sync(self)
        end
    end
end

function Explosion:draw()
    if self.__local.particles then
        love.graphics.stacked('all', function()
            love.graphics.setBlendMode('add')
            love.graphics.setColor(self.r, self.g, self.b)
            love.graphics.draw(self.__local.particles, self.x, self.y)
        end)
    end
end



-- Controller -- one of these is spawned automatically by the system per client that connects and
-- is despawned on disconnect

local Controller = sync.registerType('Controller')

function Controller:didSpawn()
    self.triangleId = self.__mgr:spawn('Triangle')
end

function Controller:willDespawn()
    if self.triangleId then
        self.__mgr:despawn(self.triangleId)
        self.triangleId = nil
    end
end

function Controller:setTarget(x, y)
    if self.triangleId then
        self.__mgr:byId(self.triangleId):setTarget(x, y)
    end
end

function Controller:setWantToShoot(wantToShoot)
    if self.triangleId then
        self.__mgr:byId(self.triangleId):setWantToShoot(wantToShoot)
    end
end

function Controller:setWantToWalk(up, down, left, right)
    if self.triangleId then
        self.__mgr:byId(self.triangleId):setWantToWalk(up, down, left, right)
    end
end



-- Server / client instances and top-level input

local server, client

function love.update(dt)
    -- Key events sent from mobile app
    if MOBILE then
        local pressed = love.thread.getChannel('KEY_PRESSED')
        local released = love.thread.getChannel('KEY_RELEASED')
        while pressed:getCount() > 0 do
            local k = pressed:pop()
            function love.keyboard.isDown(e) return e == k end
            love.keypressed(k)
        end
        while released:getCount() > 0 do
            local k = released:pop()
            function love.keyboard.isDown(e) return false end
            love.keyreleased(k)
        end
    end

    -- Scale down display if window is too small
    local w, h = love.graphics.getDimensions()
    DISPLAY_SCALE = math.min(1, w / W, h / H)

    -- Do game logic on the server
    if server then
        for _, ent in pairs(server.all) do
            if ent.update then
                ent:update(dt)
            end
        end
    end

    -- Update explosions on client (particle systems are local)
    if client then
        for _, ent in pairs(client.all) do
            if ent.__typeName == 'Explosion' then
                ent:update(dt)
            end
        end
    end

    -- Both server and client need `:process()` called on them every frame
    if server then
        server:process()
    end
    if client then
        client:process()
    end
end

function love.mousemoved(x, y)
    if client and client.controller then
        -- We move / scale the display when drawing -- apply the inverse of that here
        local w, h = DISPLAY_SCALE * W, DISPLAY_SCALE * H
        local ox, oy = 0.5 * (love.graphics.getWidth() - w), 0.5 * (love.graphics.getHeight() - h)
        client.controller:setTarget((x - ox) / DISPLAY_SCALE, (y - oy) / DISPLAY_SCALE)
    end
end

local function mouseEvent(button) -- Common mouse event handler
    if client and client.controller then
        if button == 1 then
            client.controller:setWantToShoot(love.mouse.isDown(1) or love.keyboard.isDown('space'))
        end
    end
end

function love.mousepressed(x, y, button)
    if MOBILE and not client then
        client = sync.newClient { address = SERVER_ADDRESS .. ':22122' }
    end

    mouseEvent(button)
end

function love.mousereleased(x, y, button)
    mouseEvent(button)
end

local function keyEvent(k) -- Common key event handler
    if client and client.controller then
        if k == 'w' or k == 'a' or k == 's' or k == 'd' then
            client.controller:setWantToWalk(
                love.keyboard.isDown('w'),
                love.keyboard.isDown('s'),
                love.keyboard.isDown('a'),
                love.keyboard.isDown('d'))
        end
        if k == 'space' then
            client.controller:setWantToShoot(love.mouse.isDown(1) or love.keyboard.isDown('space'))
        end
    end
end

function love.keypressed(k)
    -- Spawn server or client instances as the user asks. The server needs to know the name of our
    -- `Controller` type.
    if k == '0' then
        server = sync.newServer {
            address = '*:22122',
            controllerTypeName = 'Controller',
        }
    end
    if k == 'return' then
        client = sync.newClient { address = SERVER_ADDRESS .. ':22122' }
    end

    keyEvent(k)
end

function love.keyreleased(k)
    keyEvent(k)
end



-- Top-level drawing

local effect = moonshine(moonshine.effects.glow).chain(moonshine.effects.vignette)
effect.glow.strength = 1.6

function love.resize() -- Need to recreate `effect` with new canvas size
    effect = moonshine(moonshine.effects.glow).chain(moonshine.effects.vignette)
    effect.glow.strength = 1.6
end

function love.draw()
    effect(function()
        love.graphics.stacked('all', function()
            -- Scale down the display and center the display
            local w, h = DISPLAY_SCALE * W, DISPLAY_SCALE * H
            local ox, oy = 0.5 * (love.graphics.getWidth() - w), 0.5 * (love.graphics.getHeight() - h)
            love.graphics.setScissor(ox, oy, w, h)
            love.graphics.translate(ox, oy)
            love.graphics.scale(DISPLAY_SCALE)

            love.graphics.clear(0.2, 0.216, 0.271)

            if client and client.controller then -- Connected and playing
                -- Draw triangles
                for _, ent in pairs(client.all) do
                    if ent.__typeName == 'Triangle' then
                        ent:draw(ent == client.controller.triangle) -- Tell if it's our triangle
                    end
                end

                -- Draw bullets
                for _, ent in pairs(client.all) do
                    if ent.__typeName == 'Bullet' then
                        ent:draw()
                    end
                end

                -- Draw explosions
                for _, ent in pairs(client.all) do
                    if ent.__typeName == 'Explosion' then
                        ent:draw()
                    end
                end

                -- Draw scores in descending order
                love.graphics.stacked('all', function()
                    local scoreOrder = {}
                    for _, ent in pairs(client.all) do
                        if ent.__typeName == 'Triangle' then
                            table.insert(scoreOrder, ent)
                        end
                    end
                    table.sort(scoreOrder, function(e1, e2)
                        if e1.score == e2.score then
                            return e1.__id < e2.__id
                        end
                        return e1.score > e2.score
                    end)

                    love.graphics.setColor(1, 1, 1)
                    local scoreY = 20
                    for _, ent in ipairs(scoreOrder) do
                        love.graphics.stacked('all', function()
                            love.graphics.setColor(ent.r, ent.g, ent.b)
                            love.graphics.rectangle('fill', 20, scoreY, 12, 12)
                        end)
                        love.graphics.print(ent.score, 42, scoreY)
                        scoreY = scoreY + 16
                    end
                end)

                -- Draw fps and latency
                love.graphics.print('fps:  ' .. love.timer.getFPS(), 20, H - 52)
                love.graphics.print('ping: ' .. client.serverPeer:round_trip_time(), 20, H - 36)
            elseif client and client.serverPeer:state() == 'disconnected' then -- Disconnected
                love.graphics.print('disconnected, pres ENTER to reconnect', 20, 20)
            else -- Didn't connect yet
                love.graphics.setColor(1, 1, 1)
                if server then
                    love.graphics.print('server running', 20, 20)
                else
                    love.graphics.print('welcome to triangle warz', 20, 20)
                end
                love.graphics.print([[



move with W, A, S, D
aim with mouse or touch
shoot with left mouse button or SPACE or touch

don't worry, your own lasers can't hurt you


press ENTER or touch to connect]], 20, 20)
            end
        end)
    end)
end

