# Ghost (name TBD)

Hello traveler! I'm Ghost. Don't worry, I'm not the scary kind of ghost, just a spirit that likes to
explore, probably like yourself. Anyways... You probably want to just try this thing out. So let's
do that!

## Run Ghost

### iOS (temporarily broken - will fix after LD24)

*If you're thinking to run Ghost in iOS Simulator to try it on macOS, prefer directly running on
macOS (see below) since Simulator can cause performance degradation. Prefer testing Ghost for iOS
on actual iOS hardware (iPhone or iPad).*

** The love-ios target is broken right now while we get ready for LD24. https://github.com/expo/ghost/issues/4 **

- Open './love/platform/xcode/love.xcodeproj' with Xcode.
- Run the 'love-ios' target:
![Run Ghost on iOS](run-ios.png)

### macOS

- Copy the '.framework' files in https://love2d.org/sdk/love-osx-frameworks-0.10.zip to
'/Library/Frameworks' (at the root of your file system) if you haven't done that before.
- Download http://opensource.spotify.com/cefbuilds/cef_binary_3.3440.1806.g65046b7_macosx64.tar.bz2 and copy 'Chromium Embedded Framework.framework' from 'Debug/` to '/Library/Frameworks'.
- Open './love/platform/xcode/love.xcodeproj' with Xcode.
- Run the 'ghost-macosx' target:
![Run Ghost on macOS](run-mac.png)

### Windows

- Install CMake.
- Install Visual Studio 2013 (later versions have had issues).
- In 'megasource/', run 'sh ./run_cmake.sh' (I've done this with the 'Git BASH' utility that comes
  with 'Git for Windows', but you could also just run the one command inside this file from the
  Windows command line).
- Open and build the '.sln' file you will find deep inside 'megasource/build/'.

### Linux

- You will need the following library dependencies, however they are distributed
  in your distribution of Linux: SDL2, libGLU, openal, luajit, libdevil,
  freetype, physfs, libmodplug, mpg123, libogg, libvorbis, libtheora, openssl.
- You will also need CMake and the usual gcc commands.
- In the 'love/' directory, run `cmake -H. -Bbuild`.
- Then go into the 'build/' directory that created, and run `make` (tip: add
  `-j5` as an argument to use more CPU and less time).
- This results in a 'love' binary in that directory.
- Now from the 'base/' directory at the root of your checkout of this
  repository, run `../love/build/love .`.


## Portals

Portals offer views into content from the web to render as a Lua/Love game. That's how the 'Base'
experience included with Ghost loads other experiences. You can load your own portals that you
create, and have those portals load other portals, and so on. You have full freedom now how portals
your portal loads are displayed, given input, and managed.

Edit 'base/main.lua' to change the default portal(s) opened by the Base.

The current portal you are in is available as the global object `portal`. You can create a new
portal with `local newPortal = portal:newChild(<url>)`. You then need to call `newPortal:draw()` or
`newPortal:keypressed(...)` or such to forward events to it. This gives you full control over how
sub-portals work. 'base/main.lua' has an example of creating portals and controlling them

## Lua

- We use LuaJIT for Lua, which is exactly [Lua 5.1](https://www.lua.org/manual/5.1/) with some
  [additions](http://luajit.org/extensions.html).
- Lua is mostly sort of like JavaScript and hopefully should be easy to pick up! Here's [a good introduction](http://lua-users.org/wiki/TutorialDirectory) to the language.
- There are a lot of good benefits from using Lua, and also of course tradeoffs, vs. other languages
  (JavaScript probably being the main other one). Here are some of the many benefits:
  - Quite small and easy to pick up for people new to programming (subjective I guess).
  - LuaJIT makes Lua extremely fast. The JIT runs on macOS, Windows and Linux. On iOS and Android,
    only the interpreter runs, but LuaJIT's interpreter is still much faster than the original Lua
    one.
  - The Love game engine is available. It's open source, has breaking changes to its interface only
    approximately once every 3 years, and the code is small and neat enough for it to be
    well-understood by the whole team. It's well-documented. It's API is the same across all
    the desktop and mobile platforms Ghost supports.
  - Coroutines make non-blocking asynchronous calls possible without having to explicitly `await `
    them. This made it possible to wrap the `require` call in Lua to add network fetching, which lies
    at the core of Ghost.
  - There's a lot more...
  
### Style

I let IntelliJ's auto-format handle styling personally. We're not using an auto-formatter like
'prettier' for JavaScript yet and just hoping authors will use sane formatting. A few notes:

- Error messages should be lowercase, short, surround user-given strings in ' and code in `.
  Example:
  ```
        error("no working `url` found for '" .. origPath .. "' -- please check the `require` "
                .. "`path` or the network connection")
  ```
- Use ' to delimit strings rather than ".
- Note that `assert(val, msg)` will evaluate to `msg` if it's truthy, else raise an error mentioning
  `msg`. This is useful to do things like `local thing = foo(assert(arg, "didn't get the arg!"))`.
