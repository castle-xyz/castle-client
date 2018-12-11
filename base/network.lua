-- Based on Copas:
--     http://keplerproject.github.io/copas/reference.html
--   which is based on LuaSocket:
--     http://w3.impa.br/~diego/software/luasocket/reference.html

local copas = require 'copas'
local http = require 'copas.http'
local limit = require 'copas.limit'
local sqlite3 = require 'lsqlite3'
local serpent = require 'serpent'

local network = {}

network.requests = {}

local tasks = limit.new(10)

-- Database for persistent storage.
love.filesystem.write('dummy', '') -- Create a dummy file to make sure the save directory exists
local db = sqlite3.open(love.filesystem.getSaveDirectory() .. '/ghost_network.db')

-- Run `foo` asynchronously with the caller. Runs it as a coroutine, so that
-- network requests inside it will appear to 'block' inside that coroutine,
-- while code outside the coroutine still runs. If `onError` is given, calls it
-- with the error as the only argument when an error occurs during the
-- asynchronous call.
function network.async(foo, onError)
    local outerPortal = getfenv(2).portal
    tasks:addthread(function()
        copas.setErrorHandler(function(msg, co, skt)
            local stack = debug.traceback(msg)
            if onError then
                onError(msg)
            elseif outerPortal then
                outerPortal:handleError(msg, stack)
            elseif DEFAULT_ERROR_HANDLER then
                DEFAULT_ERROR_HANDLER(msg, stack)
            else
                print('uncaught async error:', msg, co, skt, debug.traceback(co))
            end
        end)
        foo()
    end)
end

-- Same interface as http://w3.impa.br/~diego/software/luasocket/http.html#request -- but is
-- async, tracks ongoing requests for debugging, and logs requests
function network.request(firstArg, ...)
    -- Figure out URL and method
    local url, method
    if type(firstArg) == 'table' then
        url = firstArg.url
        method = firstArg.method or 'GET'
    else
        url = firstArg
        method = select('#', ...) == 0 and 'GET' or 'POST'
    end

    -- Add entry in `network.requests` table
    local id = {} -- Cheap UUID ^_^
    table.insert(network.requests, {
        id = id,
        url = url,
        method = method,
        time = 0,
    })

    -- Function that will run after -- log time taken and remove from `network.requests`. We use a
    -- function so that we can use '...' parameters to forward all return values
    local startTime = love.timer.getTime()
    function after(...)
        local ms = math.floor(1000 * (love.timer.getTime() - startTime))
        print(ms .. 'ms', method, url)

        for i = 1, #network.requests do
            if network.requests[i].id == id then
                table.remove(network.requests, i)
                break
            end
        end

        return ...
    end

    return after(http.request(firstArg, ...))
end

-- Create persistent fetch cache
db:exec[[
    create table if not exists fetch_cache (
        timestamp datetime default current_timestamp,
        url, method,
        response, httpCode, headers, status,
        primary key (url, method)
    );
]]

-- Save a result to the persistent fetch cache
local persistFetchResult
do
    local stmt = db:prepare[[
        insert into fetch_cache (url, method, response, httpCode, headers, status)
            values (?, ?, ?, ?, ?, ?)
            on conflict (url, method) do update set
                response = excluded.response,
                httpCode = excluded.httpCode,
                headers = excluded.headers,
                status = excluded.status;
    ]]
    persistFetchResult = function(url, method, result)
        -- Make sure it's on 'https://raw.githubusercontent.com/...' with a SHA-like for now
        local sha = url:match('^https://raw.githubusercontent.com/[^/]*/[^/]*/([a-f0-9]*)/')
        if sha == nil or #sha ~= 40 then return end

        local response, httpCode, headers, status = unpack(result)
        stmt:bind(1, url)
        stmt:bind(2, method)
        stmt:bind_blob(3, response)
        stmt:bind(4, httpCode)
        stmt:bind(5, serpent.dump(headers))
        stmt:bind(6, status)
        stmt:step()
        stmt:reset()
    end
end

-- Find a result in the persistent fetch cache, `nil` if not found
local findPersistedFetchResult
do
    local stmt = db:prepare[[
        select response, httpCode, headers, status from fetch_cache
            where url = ? and method = ?;
    ]]
    findPersistedFetchResult = function(url, method)
        local result
        stmt:bind_values(url, method)
        for response, httpCode, headers, status in stmt:urows() do
            result = { response, httpCode, load(headers)(), status }
        end
        stmt:reset()
        return result
    end
end

-- The cache of `network.fetch` responses
local fetchEntries = { GET = {}, HEAD = {} }

-- Fetch a resource with default caching semantics. If `skipCache` is true, skip looking in the
-- persistent cache (still saves it to the cache after).
function network.fetch(url, method, skipCache)
    method = (method or 'GET'):upper()
    assert(method == 'GET' or method == 'HEAD', "`network.fetch` only supports 'GET' or 'HEAD'")

    -- Find or create entry
    local entry = (not skipCache) and fetchEntries[method][url]
    if not entry then -- No entry yet
        -- Store a pending entry that will collect others waiting on this
        entry = { waiters = {} }
        fetchEntries[method][url] = entry

        -- 'castle://' is just 'https://'
        url = url:gsub('^castle://', 'https://')

        -- Use persisted result if found
        local persistedResult = (not skipCache) and findPersistedFetchResult(url, method)
        if persistedResult then
            entry.result = persistedResult
        else -- Else actually fetch then persist it
            local response, httpCode, headers, status, err
            if url:match('^https?://') then
                -- Handle 'localhost' and '0.0.0.0'
                url = url:gsub('^http://localhost', 'http://127.0.0.1')
                url = url:gsub('^https://localhost', 'https://127.0.0.1')
                url = url:gsub('^http://0.0.0.0', 'http://127.0.0.1')
                url = url:gsub('^https://0.0.0.0', 'https://127.0.0.1')

                if method == 'GET' then
                    response, httpCode, headers, status = network.request(url)
                    if response == nil or httpCode ~= 200 then
                        err = "error fetching '" .. url .. "': " .. tostring(status or httpCode)
                    end
                else
                    response, httpCode, headers, status = network.request {
                        url = url,
                        method = method,
                    }
                end
            elseif url:match('^file://') then
                local filePath = url:gsub('^file://', ''):gsub('%%25', '%%')
                local file = io.open(filePath, 'rb')
                if file ~= nil then
                    if method == 'GET' then
                        response = file:read('*all')
                    else
                        response = 1
                    end
                    httpCode = 200
                    headers = {}
                    status = '200 ok'
                    file:close()
                elseif method == 'GET' then
                    err = "error opening '" .. url .. "'"
                else
                    response = nil
                    httpCode = 404
                    headers = {}
                    status = '404 not found'
                end
            end
            if err then
                entry.err = err
            else
                entry.result = { response, httpCode, headers, status }
                persistFetchResult(url, method, entry.result)
            end
        end

        -- Wake waiters
        for _, waiter in ipairs(entry.waiters) do
            copas.wakeup(waiter)
        end
        entry.waiters = nil
        if entry.err then error(entry.err) end
        return unpack(entry.result)
    elseif entry.result then -- Already have an entry with `result`, just return it
        return unpack(entry.result)
    elseif entry.err then -- Already have an entry with `err`, throw the error
        error(entry.err)
    else -- Entry with no `result` or `err` yet -- need to await it
        table.insert(entry.waiters, coroutine.running())
        copas.sleep(-1) -- Sleep till explicitly woken
        if not (entry.result or entry.err) then
            error("error fetching '" .. url .. "': coroutine awoken without `result` or `err` set")
        end
        if entry.err then error(entry.err) end
        return unpack(entry.result)
    end
end

-- Start fetching many resources so that their next fetch is faster. Every URL given must return a
-- 200 response. `baseUrl .. '/'` is prepended to non-absolute URLs.
local prefetched = {}
function network.prefetch(urls, baseUrl)
    for _, url in ipairs(urls) do
        if baseUrl and not network.isAbsolute(url) then
            url = baseUrl .. '/' .. url
        end
        print('PREFETCH', url)
        prefetched[url] = true
        network.async(function()
            network.fetch(url)
        end)
    end
end

-- Flush the `network.fetch` cache for all URLs matching a given filter function
function network.flush(filter)
    for method, entries in pairs(fetchEntries) do
        if not filter then
            fetchEntries[method] = {}
        else
            for url in pairs(entries) do
                if filter(url) then
                    entries[url] = nil
                end
            end
        end
    end
end

-- Whether a given string represents an absolute URL
function network.isAbsolute(url)
    return url:match('^castle://') or url:match('^https?://') or url:match('^file://')
end

-- Whether a given URL points to something that exists. If `skipCache` is true, skip looking in the
-- persistent cache (still saves it to the cache after). Also assumes any `network.prefetch`'d URLs
-- exist.
function network.exists(url, skipCache)
    if prefetched[url] then
        return true
    end
    local _, httpCode = network.fetch(url, 'HEAD', skipCache)
    return httpCode == 200
end

-- Return the `network.fetch` status for a given `url` and `method` combination. `method` defaults
-- to `'GET'` if not given. Returns `'none'` if not cached (either never fetched or flushed from
-- cache), `'fetching'` if currently being fetched (poasynchronously), or `'fetched'` if fetched
-- and cached.
function network.status(url, method)
    method = (method or 'GET'):upper()
    assert(method == 'GET' or method == 'HEAD', "`network.fetch` only supports 'GET' or 'HEAD'")

    local entry = fetchEntries[method][url]
    if entry ~= nil then
        if entry.result then
            return 'fetched'
        else
            return 'fetching'
        end
    else
        return 'none'
    end
end

-- Perform any updates the network system has to do -- this is run by base automatically and you
-- shouldn't have to call it...
function network.update(dt)
    for _, req in ipairs(network.requests) do
        req.time = req.time + dt
    end

    copas.step(0)
end

-- Expose `fetchEntries` for use in soft-reloading in `'main'`
network.fetchEntries = fetchEntries

return network

