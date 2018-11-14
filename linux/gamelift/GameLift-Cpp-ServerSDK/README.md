# GameLiftServerSdk C++
## Documention
You can find the official GameLift documentation [here](https://aws.amazon.com/documentation/gamelift/).
## Minimum requirements:
* Either of the following:  
  * Microsoft Visual Studio 2012 or later  
  * GNU Compiler Collection (GCC) 4.9 or later
* CMake version 3.1 or later
* A Git client available on the PATH.
## Building the SDK
### Out of source build
To build the server sdk, all you must do is the following:  
Linux -
```sh
mkdir out
cd out
cmake ..
make
```

Windows -
```sh
mkdir out
cd out
cmake -G "Visual Studio 14 2015 Win64" ..
msbuild ALL_BUILD.vcxproj /p:Configuration=Release
```

This SDK is known to work with these CMake generators:
* Visual Studio 14 2015 Win64
* Visual Studio 12 2013 Win64
* Visual Studio 11 2012 Win64
* Unix MakeFiles

After running 'msbuild' you can edit,test your server sdk with solutions file 'out/gamelift-server-sdk/aws-cpp-sdk-gamelift-server.sln'

### CMake options
#### BUILD_FOR_UNREAL

Optional variable to build the SDK for use with Unreal Engine. Set variable to 1 to create an Unreal build. Default setting is false.
With this option enabled, all dependencies are built statically and then rolled into a single shared object library.
```sh
cmake -DBUILD_FOR_UNREAL=1 ..
```

#### BUILD_SHARED_LIBS

Optional variable to select either a static or dynamic build. Default setting is static. Set variable to 1 for dynamic.

```sh
cmake -DBUILD_SHARED_LIBS=1 ..
```

#### GAMELIFT_USE_STD

Optional variable to choose whether or not to use the C++ STD when building. Default setting is true. 

The GameLift server SDK can be built to use the C++ standard library (#include <cstdio> and using namespace std;), otherwise C library functionality (#include <string.h> for example) is used instead.

To build the server SDK libraries using the C++ standard library, use the usual form for building the SDK. E.g. for Windows you might use:

```sh
mkdir out
cd out
cmake -G "Visual Studio 14 2015 Win64" ..
msbuild ALL_BUILD.vcxproj /p:Configuration=Release
```
This implies the use of the default -DGAMELIFT_USE_STD=1 flag. To turn off the dependency with the C++ std:: library, the following cmake command should be substituted.

    cmake -G "Visual Studio 14 2015 Win64" -DGAMELIFT_USE_STD=0 ..

Whether or not the C++ standard library should be used is generally a matter of preference, but there are some considerations.

* Use of -DBUILD_FOR_UNREAL=1 will override use of -DGAMELIFT_USE_STD=1 and the std:: library will not be used in an unreal build.
* Use of the -DGAMELIFT_USE_STD=0 flag modifies certain SDK API function prototypes, obviously because std::string will not be accepted as a parameter in this case. It is important when you are using libraries build with -DGAMELIFT_USE_STD=1 in your application that you continue to define the GAMELIFT_USE_STD=1 preprocessor definition prior to including the headers:
	```sh
    #define GAMELIFT_USE_STD=1  
    #include "aws\gamelift\server\GameLiftServerAPI.h"
	```
	Otherwise the prototype in the built library will not match the prototype in the header that you are including and you will get compiler errors such as these:
    ```sh
	error C2039: 'InitSDKOutcome' : is not a member of 'Aws::GameLift::Server'
    error C2065: 'InitSDKOutcome' : undeclared identifier
    ```
	and others.  
	Likewise, if the libraries are built with -DGAMELIFT_USE_STD=0 then the following is usual (though not required):
	```sh
    #define GAMELIFT_USE_STD=0
    #include "aws\gamelift\server\GameLiftServerAPI.h" GAMELIFT_USE_STD 
	```


#### USE_SYSTEM_BOOST

Option to choose whether to use the Boost library already installed on the system. Default is off.
```sh
cmake -DUSE_SYSTEM_BOOST=1 ..
```

#### USE_SYSTEM_PROTOBUF

Option to choose whether to use the protobuf library already installed on the system. Default is off.
```sh
cmake -DUSE_SYSTEM_PROTOBUF=1 ..
```

#### USE_SYSTEM_SIOCLIENT

Option to choose whether to use the socket.io client library already installed on the system. Default is off.
```sh
cmake -DUSE_SYSTEM_SIOCLIENT=1 ..
```

#### CMAKE_BUILD_TYPE

Option to choose whether to build in debug or release.  Options are Debug or Release (case sensitive).  Default is Release.
```sh
cmake -DCMAKE_BUILD_TYPE=Debug ..
```

