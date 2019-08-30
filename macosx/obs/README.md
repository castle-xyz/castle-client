Make sure to update PATH_TO_THIS_DIR.

```
git clone --recursive https://github.com/castle-games/obs-studio.git
cd obs-studio/
# change ObsHelpers.cmake so that fixup_bundle.sh always runs
mkdir build
cd build
cmake .. -DDISABLE_UI=true -DENABLE_SCRIPTING=false -DCMAKE_INSTALL_PREFIX=PATH_TO_THIS_DIR
make
sudo make install
```

delete SDL so file from bin/
