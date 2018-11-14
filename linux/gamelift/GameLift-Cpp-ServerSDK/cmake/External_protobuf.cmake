if(UNIX)
    ExternalProject_Add(protobuf
      DOWNLOAD_DIR ${download_dir}
      URL https://github.com/google/protobuf/releases/download/v3.3.0/protobuf-cpp-3.3.0.tar.gz
      URL_MD5 73c28d3044e89782bdc8d9fdcfbb5792
      SOURCE_DIR "${CMAKE_CURRENT_BINARY_DIR}/protobuf"
      INSTALL_DIR "${GameLiftServerSdk_INSTALL_PREFIX}"
      CONFIGURE_COMMAND <SOURCE_DIR>/configure CXXFLAGS=-fPIC --prefix=<INSTALL_DIR>
      CMAKE_CACHE_ARGS
          ${GameLiftServerSdk_DEFAULT_ARGS}
          ${GameLiftServerSdk_THIRDPARTYLIBS_ARGS}
    )
elseif(WIN32)
# Need to download first and then build from source using the cmake directory of Protobuf on Windows since the configure step does not seem to work.
    ExternalProject_Add(
       protobuf-src
       DOWNLOAD_DIR ${download_dir}
       URL https://github.com/google/protobuf/releases/download/v3.3.0/protobuf-cpp-3.3.0.tar.gz
       URL_MD5 73c28d3044e89782bdc8d9fdcfbb5792
       SOURCE_DIR "${CMAKE_CURRENT_BINARY_DIR}/protobuf"
       UPDATE_COMMAND ""
       PATCH_COMMAND ""
       INSTALL_COMMAND ""
       CONFIGURE_COMMAND ""
       BUILD_COMMAND ""
     )
 
     ExternalProject_Add(
       protobuf
       DEPENDS protobuf-src
       DOWNLOAD_COMMAND ""
       SOURCE_DIR ${CMAKE_CURRENT_BINARY_DIR}/protobuf/cmake
       INSTALL_DIR "${GameLiftServerSdk_INSTALL_PREFIX}"
       UPDATE_COMMAND ""
       PATCH_COMMAND ""
       CMAKE_ARGS
        -Dprotobuf_BUILD_TESTS=OFF
        -Dprotobuf_MSVC_STATIC_RUNTIME=OFF
        -Dprotobuf_BUILD_SHARED_LIBS=OFF
       CMAKE_CACHE_ARGS
         ${GameLiftServerSdk_DEFAULT_ARGS}
         ${GameLiftServerSdk_THIRDPARTYLIBS_ARGS}
     )
endif(UNIX)
