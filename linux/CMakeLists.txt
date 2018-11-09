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

set(GHOST_TARGET "Castle")
set(CMAKE_CXX_FLAGS_RELEASE "${CMAKE_CXX_FLAGS_RELEASE} /MD")
set(CMAKE_CXX_FLAGS_DEBUG "${CMAKE_CXX_FLAGS_DEBUG} /MDd")

set(GHOST_SRCS
  server.cpp
)

add_executable(${GHOST_TARGET} ${GHOST_SRCS})
target_link_libraries(${GHOST_TARGET} liblove ${LOVE_LUA_LIBRARY})
include_directories(
  ../common
  ../love/src
)