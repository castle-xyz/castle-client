Make sure to update PATH_TO_THIS_DIR.

```
git clone --recursive https://github.com/castle-games/obs-studio.git
cd obs-studio/
mkdir build
cd build
cmake .. -DDISABLE_UI=true -DENABLE_SCRIPTING=false -DCMAKE_INSTALL_PREFIX=PATH_TO_THIS_DIR
make
sudo make install
```

run `fix_dylib_paths.js` from this directory

delete SDL!
