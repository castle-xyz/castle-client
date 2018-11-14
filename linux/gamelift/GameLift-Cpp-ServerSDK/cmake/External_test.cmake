set(test_source "${CMAKE_CURRENT_SOURCE_DIR}/test")
set(test_build "${CMAKE_CURRENT_BINARY_DIR}/test")

add_optional_deps(_deps "aws-cpp-sdk-gamelift-server" "sioclient" "protobuf")

ExternalProject_Add(GameLiftServerSdk_test
  SOURCE_DIR ${test_source}
  BINARY_DIR ${test_build}
  CMAKE_CACHE_ARGS
    -DCMAKE_MODULE_PATH:PATH=${CMAKE_MODULE_PATH}
     ${GameLiftServerSdk_DEFAULT_ARGS}
     ${GameLiftServerSdk_THIRDPARTYLIBS_ARGS}
  DEPENDS
    ${_deps}
)

if(FORCE_STEP)
    ExternalProject_Add_Step(GameLiftServerSdk_test forcebuild
        COMMAND ${CMAKE_COMMAND} -E echo "Force build of GameLiftServerSdk_test"
    ${FORCE_STEP_ARGS}
    ALWAYS 1)
endif()
