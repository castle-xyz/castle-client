local sync = {}


local enet = require 'enet'
local bitser = require 'bitser'


local pairs, next, type = pairs, next, type


local BANDWIDTH_LIMIT = 0 -- Bandwidth limit in bytes per second -- 0 for unlimited

local SYNC_LEAVE = 1 -- Sentinel to sync entity leaving -- single byte when bitser'd


-- Ids

local idCounter = 0

local function genId() -- Must be called on server
    idCounter = idCounter + 1
    return idCounter
end


-- Types

local typeNameToType, typeIdToName = {}, {}

function sync.registerType(typeName, ty)
    assert(not typeNameToType[typeName], "type with name '" .. typeName .. "' already registered")

    ty = ty or {}
    ty.__typeName = typeName
    typeNameToType[typeName] = ty

    table.insert(typeIdToName, typeName)
    ty.__typeId = #typeIdToName

    return ty
end


-- Manager metatables, creation

local Common = {}
Common.__index = Common

local Client = setmetatable({}, Common)
Client.__index = Client

local Server = setmetatable({}, Common)
Server.__index = Server

function sync.newServer(props)
    local mgr = setmetatable({}, Server)
    mgr:init(props)
    return mgr
end

function sync.newClient(props)
    local mgr = setmetatable({}, Client)
    mgr:init(props)
    return mgr
end


-- Initialization, disconnection

function Common:init(props)
    self.all = {} -- `ent.__id` -> `ent` for all on server / all sync'd on client
    self.allPerType = {} -- `ent.__typeName` -> `ent.__id` -> `ent` for all in `self.all`
    for typeName in pairs(typeNameToType) do
        self.allPerType[typeName] = {}
    end
end

function Server:init(props)
    Common.init(self)

    self.isServer, self.isClient = true, false

    self.controllerTypeName = assert(props.controllerTypeName,
        "server needs `props.controllerTypeName`")

    self.host = enet.host_create(props.address or '*:22122')
    if not self.host then
        error("couldn't create server, port may already be in use")
    end
    self.host:bandwidth_limit(BANDWIDTH_LIMIT, BANDWIDTH_LIMIT)

    self.controllers = {} -- `peer` -> controller

    self.syncsPerType = {} -- `ent.__typeName` -> `ent.__id` -> (`ent` or `SYNC_LEAVE`)
    self.peerHasPerType = {} -- `peer` -> `ent.__typeName` -> `ent.__id` -> `true` for all on `peer`
end

function Client:init(props)
    Common.init(self)

    assert(props.address, "client needs `props.address` to connect to")

    self.isServer, self.isClient = false, true

    self.host = enet.host_create()
    self.host:bandwidth_limit(BANDWIDTH_LIMIT, BANDWIDTH_LIMIT)

    self.serverPeer = self.host:connect(props.address)
    self.controller = nil

    self.incomingSyncDumps = {} -- `ent.__id` -> `bitser.dumps(sync)` or `SYNC_LEAVE`
end

function Client:disconnect()
    self.serverPeer:disconnect()
    self.host:flush()
end


-- RPCs

local rpcNameToId, rpcIdToName = {}, {}

local function defRpc(name)
    if not rpcNameToId[name] then
        table.insert(rpcIdToName, name)
        rpcNameToId[name] = #rpcIdToName
    end
end

local function rpcToData(name, ...)
    return bitser.dumps({ rpcNameToId[name], select('#', ...), ... })
end

local function dataToRpc(data)
    local t = bitser.loads(data)
    return assert(rpcIdToName[t[1]], "invalid rpc id"), unpack(t, 3, t[2] + 2)
end

function Common:callRpc(peer, name, ...)
    self[name](self, peer, ...)
end


-- Querying

function Common:byId(id)
    if id == nil then
        error('attempted to look up a `nil` id')
    end
    local ent = assert(self.all[id], 'no entity with id ' .. id)
    return ent
end


-- Spawning

function Common:construct(id, typeName, ...)
    local ent
    local ty = assert(typeNameToType[typeName], "no type with name '" .. typeName .. "'")
    if ty.construct then -- User-defined construction
        ent = ty:construct(...)
    else -- Default construction
        ty.__index = ty
        ent = setmetatable({}, ty)
    end

    ent.__typeId = ty.__typeId
    ent.__id = id
    ent.__mgr = self
    ent.__local = {}

    self.all[id] = ent
    self.allPerType[typeName][id] = ent

    if ent.didConstruct then
        ent:didConstruct(...)
    end
    return ent
end

function Common:destruct(ent)
    if ent.__destructed then
        return
    end
    if ent.willDestruct then
        ent:willDestruct()
    end

    local id = ent.__id
    self.allPerType[ent.__typeName][id] = nil
    self.all[id] = nil

    ent.__destructed = true
    ent.__mgr = nil
end

function Server:spawn(typeName, ...)
    local id = genId()
    local ent = self:construct(id, typeName, ...)
    if ent.didSpawn then
        ent:didSpawn(...)
    end
    self:sync(ent)
    return id, ent
end

function Server:despawn(entOrId)
    local ent = type(entOrId) == 'table' and entOrId or self:byId(entOrId)
    if ent.__despawned then
        return
    end
    if ent.willDespawn then
        ent:willDespawn()
    end
    ent.__despawned = true
    self:sync(ent)
    self:destruct(ent)
end


-- Sync

function Server:sync(entOrId)
    local ent = type(entOrId) == 'table' and entOrId or self:byId(entOrId)
    local typeName = ent.__typeName
    local val = ent.__despawned and SYNC_LEAVE or ent
    local syncs = self.syncsPerType[typeName]
    if not syncs then
        syncs = {}
        self.syncsPerType[typeName] = syncs
    end
    syncs[ent.__id] = val
end

function Client:sync(entOrId)
end

function Server:sendSyncs(peer, syncsPerType) -- `peer == nil` to broadcast to all connected peers
    if not next(syncsPerType) then -- Empty?
        return
    end

    -- Memoized function to dump so we only serialize each required entity once
    local allDumps = {}
    local function getDump(id)
        local dump = allDumps[id]
        if dump == nil then
            local ent = self.all[id]
            if not ent then
                dump = SYNC_LEAVE
            else
                local savedLocal = ent.__local
                ent.__local = nil
                ent.__mgr = nil
                dump = bitser.dumps(ent) -- TODO(nikki): `:toSync` event
                ent.__local = savedLocal
                ent.__mgr = self
            end
            allDumps[id] = dump
        end
        return dump
    end

    -- Collect dumps per peer we're sending to and send them
    local controllers = peer and { [peer] = self.controllers[peer] } or self.controllers
    for peer, controller in pairs(controllers) do
        local dumps = {}
        for typeName, syncs in pairs(syncsPerType) do
            local ty = typeNameToType[typeName]
            if ty.getRelevants then
                local relevants = ty.getRelevants(controller)
                for id in pairs(self.peerHasPerType[peer][typeName]) do
                    if not relevants[id] then
                        dumps[id] = SYNC_LEAVE
                    end
                end
                self.peerHasPerType[peer][typeName] = {}
                for id in pairs(relevants) do
                    dumps[id] = getDump(id)
                    self.peerHasPerType[peer][typeName][id] = true
                end
            else
                for id, sync in pairs(syncs) do
                    if sync ~= SYNC_LEAVE and sync.isRelevant and not sync:isRelevant(controller) then
                        sync = SYNC_LEAVE
                    end
                    if not (sync == SYNC_LEAVE and not self.peerHasPerType[peer][typeName][id]) then
                        dumps[id] = sync == SYNC_LEAVE and SYNC_LEAVE or getDump(id)
                    end
                    self.peerHasPerType[peer][typeName][id] = sync ~= SYNC_LEAVE and true or nil
                end
            end
        end
        if next(dumps) then -- Non-empty?
            peer:send(rpcToData('receiveSyncDumps', dumps))
        end
    end
end

defRpc('receiveSyncDumps')
function Client:receiveSyncDumps(peer, dumps)
    for id, dump in pairs(dumps) do
        self.incomingSyncDumps[id] = dump
    end
end

function Common:applyReceivedSyncs()
    -- Deserialize syncs and notify leavers
    local leavers = {} -- `ent.__id` -> `ent` for entities that left
    local appliable = {} -- `id` -> `sync` for non-leaving syncs
    for id, dump in pairs(self.incomingSyncDumps) do
        local sync = type(dump) == 'string' and bitser.loads(dump) or dump
        if sync == SYNC_LEAVE then
            local ent = self.all[id]
            if ent then
                if ent.willLeave then
                    ent:willLeave()
                end
                leavers[id] = ent
            end
        else
            appliable[id] = sync
        end
    end
    self.incomingSyncDumps = {}

    -- Destruct leavers
    for id, ent in pairs(leavers) do
        self:destruct(ent)
    end

    -- Apply syncs then notify
    local synced, enterers = {}, {}
    for id, sync in pairs(appliable) do
        local ent = self.all[id]
        if not ent then -- Entered -- construct and remember to notify later
            ent = self:construct(id, typeIdToName[sync.__typeId])
            enterers[ent] = true
        end
        local defaultSyncBehavior = true
        if ent.willSync then -- Notify `:willSync` and check if it asks us to skip default syncing
            defaultSyncBehavior = ent:willSync(sync)
        end
        if defaultSyncBehavior ~= false then -- Just copy members by default
            local savedLocal = ent.__local
            for k in pairs(ent) do
                if sync[k] == nil then
                    ent[k] = nil
                end
            end
            for k, v in pairs(sync) do
                ent[k] = v
            end
            ent.__local = savedLocal
        end
        ent.__mgr = self
        synced[ent] = true
    end
    for ent in pairs(enterers) do
        if ent.didEnter then
            ent:didEnter()
        end
    end
    for ent in pairs(synced) do
        if ent.didSync then
            ent:didSync()
        end
    end
end


-- Controllers and connection / disconnection

defRpc('receiveControllerCall')
function Server:receiveControllerCall(peer, methodName, ...)
    local controller = assert(self.controllers[peer], "no controller for this `peer`")
    local method = assert(controller[methodName], "controller has no method '" .. methodName .. "'")
    method(controller, ...)
end

defRpc('receiveControllerId')
function Client:receiveControllerId(peer, controllerId)
    self:applyReceivedSyncs() -- Make sure we've received the controller
    local controller = self.all[controllerId]
    self.controller = setmetatable({}, {
        __index = function(t, k)
            local v = controller[k]
            if type(v) == 'function' then
                t[k] = function(_, ...)
                    self.serverPeer:send(rpcToData('receiveControllerCall', k, ...))
                end
                return t[k]
            else
                return v
            end
        end
    })
end

function Server:didConnect(peer)
    print("weeeee")
    assert(not self.controllers[peer], "controller for `peer` already exists")
    local controllerId, controller = self:spawn(self.controllerTypeName)
    self.controllers[peer] = controller
    self.peerHasPerType[peer] = {}
    for typeName in pairs(typeNameToType) do
        self.peerHasPerType[peer][typeName] = {}
    end
    self:sendSyncs(peer, self.allPerType)
    peer:send(rpcToData('receiveControllerId', controllerId))
end

function Client:didConnect()
end

function Server:didDisconnect(peer)
    local controller = assert(self.controllers[peer], "no controller for this `peer`")
    self.controllers[peer] = nil
    self.peerHasPerType[peer] = nil
    self:despawn(controller)
end

function Client:didDisconnect()
    self.controller = nil
end


-- Top-level process

function Common:process()
    local errs = {}

    while true do
        local event = self.host:service(0)
        if not event then break end

        local success, err = pcall(function()
            if event.type == 'receive' then
                self:callRpc(event.peer, dataToRpc(event.data))
            elseif event.type == 'connect' then
                self:didConnect(event.peer)
            elseif event.type == 'disconnect' then
                self:didDisconnect(event.peer)
            end
        end)
        table.insert(errs, err)
    end

    self:processSyncs()

    self.host:flush()

    if next(errs) then
        error('`:process()` errors:\n\t' .. table.concat(errs, '\n\t'))
    end
end

function Server:processSyncs()
    self:sendSyncs(nil, self.syncsPerType)
    self.syncsPerType = {}
end

function Client:processSyncs()
    self:applyReceivedSyncs()
end


return sync
