cmake_minimum_required(VERSION 3.1)

project(GameLiftServerSdk CXX)

set(CMAKE_MODULE_PATH "${CMAKE_CURRENT_SOURCE_DIR}/cmake"
  ${CMAKE_MODULE_PATH})

# Set up some standard defaults, these will be passed down into external the
# projects.
include(BuildType)
include(BuildLocation)
include(ExternalProject)
include(download_dir)

# Set up a few default arguments for all projects, such as the install prefix,
# CMake prefix path and the runtime/library output directories.
option(BUILD_SHARED_LIBS "Build libraries as SHARED" OFF)
option(GAMELIFT_USE_STD "Use C++ std when building" ON)
option(BUILD_FOR_UNREAL "Flag to easily configure the sdk for Unreal." OFF)

if(BUILD_FOR_UNREAL)
# For Unreal, we always build our dependencies as static libraries and 'hide' them under the shared objects.
   set(BUILD_SHARED_LIBS OFF)
   set(GAMELIFT_USE_STD OFF)
endif()

set(GameLiftServerSdk_INSTALL_PREFIX "${GameLiftServerSdk_BINARY_DIR}/prefix")
set(GameLiftServerSdk_DEFAULT_ARGS
  "-DBUILD_SHARED_LIBS:BOOL=${BUILD_SHARED_LIBS}"
  "-DCMAKE_PREFIX_PATH:PATH=${GameLiftServerSdk_INSTALL_PREFIX};${CMAKE_PREFIX_PATH}"
  "-DCMAKE_INSTALL_PREFIX:PATH=${GameLiftServerSdk_INSTALL_PREFIX}"
  "-DGAMELIFT_USE_STD:BOOL=${GAMELIFT_USE_STD}"
  "-DBUILD_FOR_UNREAL:BOOL=${BUILD_FOR_UNREAL}"
  "-DCMAKE_CXX_COMPILER:PATH=${CMAKE_CXX_COMPILER}")

# If there is a CMAKE_BUILD_TYPE it is important to ensure it is passed down.
if(CMAKE_BUILD_TYPE)
  list(APPEND GameLiftServerSdk_DEFAULT_ARGS
    "-DCMAKE_BUILD_TYPE:STRING=${CMAKE_BUILD_TYPE}")
endif()

set(FORCE_STEP_DEFAULT "build")
if(CMAKE_CONFIGURATION_TYPES)
  set(FORCE_STEP_DEFAULT "configure")
endif()

set(FORCE_STEP ${FORCE_STEP_DEFAULT} CACHE STRING
  "Should the top level projects force configure/build/install each make")
set_property(CACHE FORCE_STEP PROPERTY STRINGS OFF configure build install)

if(FORCE_STEP STREQUAL configure)
  set(dependee "update")
elseif(FORCE_STEP STREQUAL build)
  set(dependee "configure")
elseif(FORCE_STEP STREQUAL install)
  set(dependee "build")
endif()

set(FORCE_STEP_ARGS
  DEPENDEES ${dependee}
  DEPENDERS ${FORCE_STEP}
)

# Convenience macro for adding dependencies optionally if not using system
# copies. This function takes the external project target name, looks for a
# variable of the form USE_SYSTEM_TARGETNAME, if this does not exist or is set
# to false the supplied target name will be added to dep_var.
macro(add_optional_deps dep_var)
  foreach(_dependency ${ARGN})
    string(TOUPPER "${_dependency}" _uDependency)
    if(NOT USE_SYSTEM_${_uDependency})
      list(APPEND ${dep_var} ${_dependency})
    endif()
  endforeach()
endmacro()

option(BUILD_SERVER_SDK "Build the server SDK" ON)
option(BUILD_EXAMPLE_APP "Build the example app" OFF)

# Add the third party dependencies first
add_subdirectory(thirdparty)

option(BUILD_DOCUMENTATION "Build documentation (Doxygen)" OFF)
option(ENABLE_TESTING "Enable testing for projects" OFF)
list(APPEND GameLiftServerSdk_DEFAULT_ARGS
  "-DBUILD_DOCUMENTATION:BOOL=${BUILD_DOCUMENTATION}"
  "-DENABLE_TESTING:BOOL=${ENABLE_TESTING}")

configure_file(cmake/CMakeLists.txt.in googletest-download/CMakeLists.txt)
execute_process(COMMAND ${CMAKE_COMMAND} -G "${CMAKE_GENERATOR}" .
  RESULT_VARIABLE result
  WORKING_DIRECTORY ${CMAKE_BINARY_DIR}/googletest-download )
if(result)
  message(FATAL_ERROR "CMake step for googletest failed: ${result}")
endif()
execute_process(COMMAND ${CMAKE_COMMAND} --build .
  RESULT_VARIABLE result
  WORKING_DIRECTORY ${CMAKE_BINARY_DIR}/googletest-download )
if(result)
  message(FATAL_ERROR "Build step for googletest failed: ${result}")
endif()

# The gtest/gtest_main targets carry header search path
# dependencies automatically when using CMake 2.8.11 or
# later. Otherwise we have to add them here ourselves.
if (CMAKE_VERSION VERSION_LESS 2.8.11)
  include_directories("${gtest_SOURCE_DIR}/include")
endif()


# Now for the actual projects!
if(BUILD_SERVER_SDK OR BUILD_EXAMPLE_APP)
  include(External_serversdk)
endif()
if(BUILD_EXAMPLE_APP)
  include(External_exampleapp)
endif()

# Test project
if(ENABLE_TESTING)
  include(External_test)
endif()
