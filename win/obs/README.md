Do not do this in WSL! You will end up with a cmake error that looks like
`c1xx : fatal error C1083: Cannot open source file: 'CMakeCXXCompilerId.cpp'`
https://developercommunity.visualstudio.com/content/problem/240102/problem-with-compile-c-project-c1xx-fatal-error-c1.html

```
git clone --recursive https://github.com/castle-games/obs-studio.git
```

download https://obsproject.com/downloads/dependencies2017.zip and extract as sibling

```
cd obs-studio/
mkdir build
cmake.exe -DDISABLE_UI=true -DENABLE_SCRIPTING=false -DCMAKE_INSTALL_PREFIX=build -DDepsPath=/d/ghost/dependencies2017/win32/include -G "Visual Studio 15" -H. -Bbuild
```

open build/ALL_BUILD.vcxproj

output is is build/rundir/Release