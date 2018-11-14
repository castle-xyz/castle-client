unset(_deps)
add_optional_deps(_deps "boost")

get_filename_component(_self_dir ${CMAKE_CURRENT_LIST_FILE} PATH)

if(UNIX)
    ExternalProject_Add(sioclient
      GIT_REPOSITORY https://github.com/socketio/socket.io-client-cpp.git
      GIT_TAG 1.6.1
      GIT_SUBMODULES
        lib/websocketpp
        lib/rapidjson
      SOURCE_DIR "${CMAKE_CURRENT_BINARY_DIR}/sioclient"
      INSTALL_DIR "${GameLiftServerSdk_INSTALL_PREFIX}"
      PATCH_COMMAND ${CMAKE_COMMAND} -E copy_if_different
        "${_self_dir}/sioclient.CMakeLists.txt"
        "<SOURCE_DIR>/CMakeLists.txt"
      CMAKE_CACHE_ARGS
        ${GameLiftServerSdk_DEFAULT_ARGS}
        ${GameLiftServerSdk_THIRDPARTYLIBS_ARGS}
        "-DCMAKE_POSITION_INDEPENDENT_CODE:BOOL=true"
      DEPENDS
        ${_deps}
    )
elseif(WIN32)
    ExternalProject_Add(sioclient-src
       GIT_REPOSITORY https://github.com/socketio/socket.io-client-cpp.git
       GIT_TAG 1.6.1
       GIT_SUBMODULES
        lib/websocketpp
        lib/rapidjson
       SOURCE_DIR "${CMAKE_CURRENT_BINARY_DIR}/sioclient"
       UPDATE_COMMAND ""
       PATCH_COMMAND ""
       INSTALL_COMMAND ""
       CONFIGURE_COMMAND ""
       BUILD_COMMAND ""
     )
 
     ExternalProject_Add(sioclient
       DEPENDS sioclient-src
       DOWNLOAD_COMMAND ""
       SOURCE_DIR "${CMAKE_CURRENT_BINARY_DIR}/sioclient"
       INSTALL_DIR "${GameLiftServerSdk_INSTALL_PREFIX}"
       PATCH_COMMAND ${CMAKE_COMMAND} -E copy_if_different
         "${_self_dir}/sioclient.CMakeLists.txt"
         "<SOURCE_DIR>/CMakeLists.txt"
       CMAKE_CACHE_ARGS
         ${GameLiftServerSdk_DEFAULT_ARGS}
         ${GameLiftServerSdk_THIRDPARTYLIBS_ARGS}
       DEPENDS
         ${_deps}
     )
     if(MSVC14)
        add_custom_command(
            TARGET sioclient-src POST_BUILD
            COMMAND git pull origin master
            WORKING_DIRECTORY "${CMAKE_CURRENT_BINARY_DIR}/sioclient/lib/websocketpp"
        )
    endif(MSVC14)
endif(UNIX)
