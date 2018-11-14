set(exampleapp_source "${CMAKE_CURRENT_SOURCE_DIR}/gamelift-example-app")
set(exampleapp_build "${CMAKE_CURRENT_BINARY_DIR}/gamelift-example-app")

set(_deps "aws-cpp-sdk-gamelift-server")
add_optional_deps(_deps "boost" "protobuf")

ExternalProject_Add(exampleapp
  SOURCE_DIR ${exampleapp_source}
  BINARY_DIR ${exampleapp_build}
  CMAKE_CACHE_ARGS
    ${GameLiftServerSdk_DEFAULT_ARGS}
    ${GameLiftServerSdk_THIRDPARTYLIBS_ARGS}
    -DCMAKE_MODULE_PATH:PATH=${CMAKE_MODULE_PATH}
  DEPENDS
    ${_deps}
)

if(FORCE_STEP)
  ExternalProject_Add_Step(exampleapp forcebuild
    COMMAND ${CMAKE_COMMAND} -E echo "Force build of exampleapp"
    ${FORCE_STEP_ARGS}
    ALWAYS 1)
endif()
