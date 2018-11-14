set(serversdk_source "${CMAKE_CURRENT_SOURCE_DIR}/gamelift-server-sdk")
set(serversdk_build "${CMAKE_CURRENT_BINARY_DIR}/gamelift-server-sdk")

add_optional_deps(_deps "sioclient" "protobuf")

ExternalProject_Add(aws-cpp-sdk-gamelift-server
  SOURCE_DIR ${serversdk_source}
  BINARY_DIR ${serversdk_build}
  CMAKE_CACHE_ARGS
    ${GameLiftServerSdk_DEFAULT_ARGS}
    ${GameLiftServerSdk_THIRDPARTYLIBS_ARGS}
    -DCMAKE_MODULE_PATH:PATH=${CMAKE_MODULE_PATH}
  DEPENDS
    ${_deps}
)

if(FORCE_STEP)
  ExternalProject_Add_Step(aws-cpp-sdk-gamelift-server forcebuild
    COMMAND ${CMAKE_COMMAND} -E echo "Force build of aws-cpp-sdk-gamelift-server"
    ${FORCE_STEP_ARGS}
    ALWAYS 1)
endif()
