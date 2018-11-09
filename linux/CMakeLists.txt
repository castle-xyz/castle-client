if(${CMAKE_SOURCE_DIR} STREQUAL ${CMAKE_BINARY_DIR})
	# Protop: run cmake like this: cmake -G "<generator>" -H. -Bbuild
	message(FATAL_ERROR "Prevented in-tree build.")
endif()

cmake_minimum_required(VERSION 3.1)

include(ExternalProject)

project(castle-server)

if(EXISTS ${MEGA_LOVE}/CMakeLists.txt)
	message(STATUS "-----------------------------------------------------")
	message(STATUS "Configuring: love")
	message(STATUS "-----------------------------------------------------")
	#set(ARCHIVE_OUTPUT_DIRECTORY  "${CMAKE_CURRENT_BINARY_DIR}/$<CONFIGURATION>")
	add_subdirectory(${MEGA_LOVE} ${CMAKE_BINARY_DIR}/love)

	# Turn off third-party warnings when building with LOVE.
	#foreach(MEGA_LIB ${MEGA_3P})
	#	disable_warnings(${MEGA_LIB})
	#endforeach()
else()
	message(STATUS "LOVE was not found")
endif()

set(GHOST_TARGET "castle-server")
set(CMAKE_CXX_FLAGS_RELEASE "${CMAKE_CXX_FLAGS_RELEASE} /MD")
set(CMAKE_CXX_FLAGS_DEBUG "${CMAKE_CXX_FLAGS_DEBUG} /MDd")

SET(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} -ldl -lpthread -lm")

set(GHOST_SRCS
  server.cpp
)

add_executable(${GHOST_TARGET} ${GHOST_SRCS})
target_link_libraries(${GHOST_TARGET} liblove ${CASTLE_LUA_LIBRARY})
include_directories(
  ../common
  ../love/src
  ${CASTLE_INCLUDE_DIRS}
)

target_link_libraries(${GHOST_TARGET} ${CASTLE_LINK_LIBRARIES} ${CASTLE_3P})
find_package(OpenSSL REQUIRED)
target_link_libraries(${GHOST_TARGET} OpenSSL::SSL)

if(CASTLE_EXTRA_DEPENDECIES)
	add_dependencies(${GHOST_TARGET} ${CASTLE_EXTRA_DEPENDECIES})
endif()

# From cef_macros.cmake
# Copy a list of files from one directory to another. Relative files paths are maintained.
# The path component of the source |file_list| will be removed.
macro(COPY_FILES target file_list source_dir target_dir)
  foreach(FILENAME ${file_list})
    set(source_file ${source_dir}/${FILENAME})
    get_filename_component(target_name ${FILENAME} NAME)
    set(target_file ${target_dir}/${target_name})

    string(FIND ${source_file} "$<CONFIGURATION>" _pos)
    if(NOT ${_pos} EQUAL -1)
      # Must test with an actual configuration directory.
      string(REPLACE "$<CONFIGURATION>" "Release" existing_source_file ${source_file})
      if(NOT EXISTS ${existing_source_file})
        string(REPLACE "$<CONFIGURATION>" "Debug" existing_source_file ${source_file})
      endif()
    else()
      set(existing_source_file ${source_file})
    endif()

    if(IS_DIRECTORY ${existing_source_file})
      add_custom_command(
        TARGET ${target}
        POST_BUILD
        COMMAND ${CMAKE_COMMAND} -E copy_directory "${source_file}" "${target_file}"
        VERBATIM
        )
    else()
      add_custom_command(
        TARGET ${target}
        POST_BUILD
        COMMAND ${CMAKE_COMMAND} -E copy_if_different "${source_file}" "${target_file}"
        VERBATIM
        )
    endif()
  endforeach()
endmacro()

set(GHOST_FILES base)
COPY_FILES("${GHOST_TARGET}" "${GHOST_FILES}" "${CMAKE_CURRENT_SOURCE_DIR}/.." "${CMAKE_CURRENT_BINARY_DIR}")

set(GHOST_EXTRA_LUA_FILES conf.lua)
COPY_FILES("${GHOST_TARGET}" "${GHOST_EXTRA_LUA_FILES}" "${CMAKE_CURRENT_SOURCE_DIR}" "${CMAKE_CURRENT_BINARY_DIR}/base")