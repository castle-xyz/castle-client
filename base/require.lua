-- scoped + async + network `require`

-- We need to write a new Lua function rather than change `package.loaders` because the default
-- `require` is a C function and coroutines can't yield through it.

-- Useful reference implementation of default `require` at:
-- https://github.com/hoelzro/lua-procure/blob/5abd3d30987bf3f0984d1e452cdb7db5e0b50a1c/procure/init.lua

local defaultRequire = require

local parseLua = require 'parseLua'

-- New table based on `a` with `b` providing defaults
local function defaultOpts(a, b)
    local o = {}
    if type(b) == 'table' then for k, v in pairs(b) do o[k] = v end end
    if type(a) == 'table' then for k, v in pairs(a) do o[k] = v end end
    return o
end

-- Find potential resources to fetch in Lua code
local resourceFuncs = {
    ['love.graphics.newFont'] = true,
    ['love.graphics.newImage'] = true,
    ['love.image.newImageData'] = true,
    ['love.audio.newSource'] = true,
    ['love.graphics.newShader'] = true,
}
local function parseResources(code)
    local result = {}
    local t = parseLua(code)
    for i = 1, #t do
        local a, b, c, d, e = t[i], t[i + 1], t[i + 2], t[i + 3], t[i + 4]
        if a[1] == 'identifier' and a[2] == 'require' and
                b and (b[1] == 'whitespace' or (b[1] == 'operator' and b[2] == '(')) and
                c and c[1] == 'string' then
            -- `require '...'` or `require('...'`
            table.insert(result, { type = 'lua', path = load('return ' .. c[2])() })
        elseif a[1] == 'identifier' and resourceFuncs[a[2]] and
                b and b[1] == 'operator' and b[2] == '(' and
                c and c[1] == 'string' and
                d and (d[1] == 'operator' and (d[2] == ')' or d[2] == ',')) then
            -- `<func>('...')` or `<func>('...',` with a `resourceFuncs` above
            table.insert(result, { type = 'asset', path = load('return ' .. c[2])() })
        end
    end
    return result
end

local function explicitRequire(path, opts)
    -- Built-in?
    if path ~= 'main' then
        local builtin = _G.package.loaded[path]
        if builtin then return builtin end
        pcall(function() builtin = defaultRequire(path) end)
        if builtin then return builtin end
    end

    local opts = opts or {}
    local basePath = opts.basePath or REQUIRE_BASE_PATH
    local parentEnv = assert(opts.parentEnv, '`explicitRequire` needs `parentEnv`')
    local childEnv = opts.childEnv
    local saveCache = opts.saveCache
    local noEval = opts.noEval
    local preamble = opts.preamble

    -- Make sure we use `package` from `parentEnv` to handle `package.loaded` correctly
    local package = parentEnv.package

    -- Cached?
    local found = package.loaded[path]
    if found ~= nil then return found end

    local origPath = path
    path = path:gsub('%.lua$', '')

    local isAbsolute = false
    local absolute

    if network.isAbsolute(path) then -- Already absolute?
        isAbsolute = true
        absolute = path
    elseif basePath then
        path = path:gsub('^%.*', ''):gsub('%.*$', '') -- Remove leading or trailing '.'s
        absolute = basePath .. '/' .. path:gsub('%.', '/')
    else
        error("'" .. origPath .. "' is not absolute but no base path is known")
    end

    -- Deal with '.lua' or '/init.lua' appending. If both fail, try with `skipCache`.
    local url
    if network.exists(absolute .. '.lua') then
        url = absolute .. '.lua'
    elseif network.exists(absolute .. '/init.lua') then
        url = absolute .. '/init.lua'
    elseif network.exists(absolute .. '.lua', true) then
        url = absolute .. '.lua'
    elseif network.exists(absolute .. '/init.lua', true) then
        url = absolute .. '/init.lua'
    else
        error("no working `url` found for '" .. origPath .. "' -- please check the `require` "
                .. "`path` or the network connection")
    end

    -- Already `require`d from final `url`?
    if package.loaded[url] then return package.loaded[url] end

    -- Use the `parentEnv` by default for the new module, but if a new `childEnv` is given, make
    -- that the `parentEnv` for sub-`require`s by default
    childEnv = childEnv or parentEnv
    if childEnv ~= parentEnv then
        local oldChildRequire = childEnv.require
        childEnv.require = function(path, opts)
            return oldChildRequire(path, defaultOpts(opts, {
                parentEnv = childEnv,
            }))
        end
    end

    -- Update `basePath` for sub-`require`s -- do it here after we've figured out `url` with
    -- potential '/init.lua' on the end etc.
    if isAbsolute then
        local newBasePath = url:gsub('/?init%.lua$', ''):gsub('(.*)/(.*)', '%1')
        local oldChildEnv = childEnv
        local oldChildRequire = childEnv.require
        childEnv = setmetatable({}, { __index = oldChildEnv, __newIndex = oldChildEnv })
        childEnv.require = function(path, opts)
            return oldChildRequire(path, defaultOpts(opts, {
                basePath = newBasePath,
                childEnv = childEnv,
            }))
        end
        childEnv.CASTLE_PREFETCH = function(urls)
            network.prefetch(urls, newBasePath)
        end

        -- TODO(nikki): In process of using below to fix `portal.newPortal` with relative paths
        if parentEnv ~= oldChildEnv then
            oldChildEnv.require = childEnv.require
        end
    end

    -- Fetch
    local firstFetch = network.status(url) == 'none'
    local response = network.fetch(url)
    if preamble then response = preamble .. response end

    -- If this is the first fetch of the body, asynchronously pre-fetch resources it references
    if firstFetch then
        for _, resource in pairs(parseResources(response)) do
            network.async(function()
                pcall(function() -- Allow failure as we want the error to be hit on synchronous use
                    if resource.type == 'lua' then
                        childEnv.require(resource.path, { noEval = true })
                    elseif resource.type == 'asset' then
                        network.fetch(network.isAbsolute(resource.path) and resource.path or
                                (childEnv.portal.basePath .. '/' .. resource.path))
                    end
                end)
            end)
        end
    end

    -- No eval?
    if opts.noEval then return end

    -- Parse
    childEnv._G = childEnv -- `_G` is never updated by Lua, we do it ourselves
    local chunk, err = load(response, path:gsub('(.*)/(.*)', '%2'), 'bt', childEnv)
    if chunk == nil then
        error("error parsing '" .. url .. "': " .. err)
    end

    -- Figure out the short alias if absolute
    local alias = origPath
    if isAbsolute then
        alias = origPath:gsub('/?init%.lua$', ''):gsub('(.*)/(.*)', '%2')
    end
    alias = alias:gsub('%.lua$', ''):gsub('%.*$', ''):gsub('^', '.')

    -- Run
    local result = chunk(alias)

    -- Save to cache
    if saveCache ~= false then
        if result ~= nil then
            package.loaded[url] = result
        elseif package.loaded[url] == nil then
            package.loaded[url] = true
        end
    end

    return result == nil and true or result
end

local function require(path, opts)
    return explicitRequire(path, defaultOpts(opts, {
        parentEnv = _G,
    }))
end

return require
