local jsEvents = require 'jsEvents'

local ffi = require 'ffi'
local C = ffi.C


local castle = {}


-- user

castle.user = {}

jsEvents.listen('CASTLE_SET_IS_LOGGED_IN', function(isLoggedIn)
    castle.user.isLoggedIn = isLoggedIn
    castle.isLoggedIn = isLoggedIn --- XXX: Backwards compat...
end)


-- multiplayer

castle.multiplayer = {}

function castle.multiplayer.connectClient(mediaUrl, callback)
    jsEvents.listen('CASTLE_CONNECT_MULTIPLAYER_CLIENT_RESPONSE', function(params)
        callback(params.address)
    end)
    jsEvents.send('CASTLE_CONNECT_MULTIPLAYER_CLIENT_REQUEST', {
        mediaUrl = mediaUrl,
    })
end
castle.connectClient = castle.multiplayer.connectClient -- XXX: Backwards compat...

ffi.cdef 'void ghostHeartbeat(int numClients);'
function castle.multiplayer.heartbeat(numClients)
    if CASTLE_SERVER then
        C.ghostHeartbeat(numClients)
    end
end
castle.heartbeat = castle.multiplayer.heartbeat -- XXX: Backwards compat...

ffi.cdef 'void ghostSetIsAcceptingPlayers(bool isAcceptingPlayers);'
function castle.multiplayer.setIsAcceptingClients(isAcceptingClients)
    if CASTLE_SERVER then
        C.ghostSetIsAcceptingPlayers(isAcceptingClients)
    end
end
castle.setIsAcceptingClients = castle.multiplayer.setIsAcceptingClients -- XXX: Backwards compat...


return castle