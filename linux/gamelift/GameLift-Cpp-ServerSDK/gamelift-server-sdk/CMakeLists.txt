CMAKE_MINIMUM_REQUIRED(VERSION 3.1)

PROJECT(aws-cpp-sdk-gamelift-server)
SET(CMAKE_CXX_STANDARD 11)
SET(TARGET_NAME aws-cpp-sdk-gamelift-server)

if(BUILD_FOR_UNREAL)
   set(BUILD_SHARED_LIBS ON)
   set(CMAKE_FIND_LIBRARY_SUFFIXES ${CMAKE_STATIC_LIBRARY_SUFFIX})
endif()

if(GAMELIFT_USE_STD)
    message("GameLift SDK will use STD in its interface")
    add_definitions(-DGAMELIFT_USE_STD)
endif(GAMELIFT_USE_STD)

# -----------------------------
# Set up library
# -----------------------------

set(GAMELIFT_SOURCE_ROOT ${CMAKE_SOURCE_DIR})
file(GLOB AWS_GAMELIFT_COMMON_HEADERS "" "${GAMELIFT_SOURCE_ROOT}/include/aws/gamelift/common/*.h*")
file(GLOB AWS_GAMELIFT_COMMON_SOURCE  "" "${GAMELIFT_SOURCE_ROOT}/source/aws/gamelift/common/*.cpp")
file(GLOB AWS_GAMELIFT_SERVER_HEADERS "" "${GAMELIFT_SOURCE_ROOT}/include/aws/gamelift/server/*.h*")
file(GLOB AWS_GAMELIFT_SERVER_SOURCE  "" "${GAMELIFT_SOURCE_ROOT}/source/aws/gamelift/server/*.cpp")
file(GLOB AWS_GAMELIFT_MODEL_HEADERS "" "${GAMELIFT_SOURCE_ROOT}/include/aws/gamelift/server/model/*.h*")
file(GLOB AWS_GAMELIFT_INTERNAL_HEADERS "" "${GAMELIFT_SOURCE_ROOT}/include/aws/gamelift/internal/*.h")
file(GLOB AWS_GAMELIFT_INTERNAL_NETWORK_HEADERS "" "${GAMELIFT_SOURCE_ROOT}/include/aws/gamelift/internal/network/*.h")
set(GAMELIFT_SERVER_SRC
    ${AWS_GAMELIFT_INTERNAL_NETWORK_HEADERS}
    ${AWS_GAMELIFT_INTERNAL_HEADERS}
    ${AWS_GAMELIFT_COMMON_HEADERS}
    ${AWS_GAMELIFT_MODEL_HEADERS}
    ${AWS_GAMELIFT_SERVER_HEADERS}
    ${AWS_GAMELIFT_COMMON_SOURCE}
    ${AWS_GAMELIFT_SERVER_SOURCE}
    ${GAMELIFT_SOURCE_ROOT}/source/aws/gamelift/server/protocols/sdk.pb.cc
)

add_library(${TARGET_NAME} ${GAMELIFT_SERVER_SRC})

# -----------------------------
# Set up include directories
# -----------------------------

#boost
find_package(Boost COMPONENTS system random REQUIRED)
include_directories(${Boost_INCLUDE_DIRS})

#socketIO
find_package(sioclient REQUIRED)
include_directories(${SIOCLIENT_INCLUDE_DIRS})

#protobuf
find_package(Protobuf REQUIRED)
include_directories(${PROTOBUF_INCLUDE_DIRS})

if(WIN32)
    add_definitions(/wd4244 /wd4267 /wd4018 /wd4355 /wd4800 /wd4251 /wd4996 /wd4146 /wd4305 /wd4065 /wd4506)
endif()

target_include_directories(${TARGET_NAME}
    PUBLIC
      $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
      $<INSTALL_INTERFACE:include>
    PRIVATE
      source
)


# Prevent overriding the parent project's compiler/linker
# settings on Windows
set(gtest_force_shared_crt ON CACHE BOOL "" FORCE)

# Add googletest directly to our build. This defines
# the gtest and gtest_main targets.
add_subdirectory(${CMAKE_BINARY_DIR}/../googletest-src
                 ${CMAKE_BINARY_DIR}/../googletest-build)

include_directories("${gtest_SOURCE_DIR}/include"
                    "${gmock_SOURCE_DIR}/include")



# -----------------------------
# Set up link targets
# -----------------------------


if(BUILD_SHARED_LIBS)    
    #Exporting symbols on the shared object/dll.
    add_definitions(-DUSE_IMPORT_EXPORT)
    add_definitions(-DAWS_GAMELIFT_EXPORTS)
endif(BUILD_SHARED_LIBS)

if(BUILD_FOR_UNREAL AND UNIX)
   if(CMAKE_CXX_COMPILER_ID MATCHES "Clang")
      message(FATAL_ERROR "Clang not supported; CMake will exit.")
   else()
      # We roll all dependencies static libraries under a single shared object file.
      set(LD_WHOLE_ARCHIVE "-Wl,--whole-archive")
      set(LD_NO_WHOLE_ARCHIVE "-Wl,--no-whole-archive")
      
      set(LD_VERSION_SCRIPT "-Wl,--version-script=${GAMELIFT_SOURCE_ROOT}/exports.version")
      set(CMAKE_SHARED_LINKER_FLAGS "${CMAKE_SHARED_LINKER_FLAGS} ${LD_VERSION_SCRIPT}")

      target_link_libraries(${TARGET_NAME}
          ${LD_WHOLE_ARCHIVE}
          ${Boost_LIBRARIES}
          ${SIOCLIENT_LIBRARY}
          ${PROTOBUF_LIBRARY}
          ${LD_NO_WHOLE_ARCHIVE}
      )
   endif()
else()
   if(CMAKE_BUILD_TYPE STREQUAL "Debug")
     string(REPLACE "libprotobuf.lib" "libprotobufd.lib" PROTOBUF_LIBRARY_VARIANT ${PROTOBUF_LIBRARY})  
   else()
     set(PROTOBUF_LIBRARY_VARIANT ${PROTOBUF_LIBRARY})
   endif()
   
   target_link_libraries(${TARGET_NAME}
       ${Boost_LIBRARIES}
       ${SIOCLIENT_LIBRARIES}
       ${PROTOBUF_LIBRARY_VARIANT}
   )
endif()

# If we are compiling for visual studio, create a sane directory tree.
if(MSVC)
    source_group("Header Files\\aws\\gamelift\\common" FILES ${AWS_GAMELIFT_COMMON_HEADERS})
    source_group("Header Files\\aws\\gamelift\\server" FILES ${AWS_GAMELIFT_SERVER_HEADERS})
    source_group("Header Files\\aws\\gamelift\\internal" FILES ${AWS_GAMELIFT_INTERNAL_HEADERS})
    source_group("Header Files\\aws\\gamelift\\internal\\network" FILES ${AWS_GAMELIFT_INTERNAL_NETWORK_HEADERS})
    source_group("Header Files\\aws\\gamelift\\server\\model" FILES ${AWS_GAMELIFT_MODEL_HEADERS})
    source_group("Source Files\\common" FILES ${AWS_GAMELIFT_COMMON_SOURCE})
    source_group("Source Files\\server" FILES ${AWS_GAMELIFT_SERVER_SOURCE})
    source_group("Source Files\\server\\protocols" FILES ${AWS_GAMELIFT_SERVER_PROTOCOLS_SOURCE})
    add_definitions("/Zi")
    # Make the Release version create a PDB
    set(CMAKE_CXX_FLAGS_RELEASE "${CMAKE_CXX_FLAGS_RELEASE} /Zi")
    # Enable Generate Debug Info for both debug and release configure
    set_property(TARGET aws-cpp-sdk-gamelift-server APPEND PROPERTY LINK_FLAGS /DEBUG)
    # Minimize the size of the resulting DLLs
    set(CMAKE_SHARED_LINKER_FLAGS_RELEASE "${CMAKE_SHARED_LINKER_FLAGS_RELEASE} /OPT:REF")
endif()

# -----------------------------
# Set up install targets
# -----------------------------

install(TARGETS ${TARGET_NAME}
        ARCHIVE DESTINATION lib
        LIBRARY DESTINATION lib
        RUNTIME DESTINATION bin
)
install(FILES ${TARGET_NAME}Config.cmake
        DESTINATION cmake
)
install(DIRECTORY include/
        DESTINATION include
)