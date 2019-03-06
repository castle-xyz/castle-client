if(${CMAKE_SOURCE_DIR} STREQUAL ${CMAKE_BINARY_DIR})
	# Protop: run cmake like this: cmake -G "<generator>" -H. -Bbuild
	message(FATAL_ERROR "Prevented in-tree build.")
endif()

cmake_minimum_required(VERSION 3.1)

include(ExternalProject)

project(megasource)

set(MEGA TRUE)

set (CMAKE_CXX_STANDARD 11)

if(CMAKE_SIZEOF_VOID_P EQUAL 8)
	set(MEGA_X64 TRUE)
	set(MEGA_ARCH x64)
else()
	set(MEGA_X86 TRUE)
	set(MEGA_ARCH x86)
endif()

if(MSVC)
	set(CMAKE_SUPPRESS_REGENERATION TRUE)
endif()

if(MSVC)
	set(CMAKE_CXX_FLAGS_RELEASE "${CMAKE_CXX_FLAGS_RELEASE} /MP")
	set(CMAKE_C_FLAGS_RELEASE "${CMAKE_C_FLAGS_RELEASE} /MP")
	if(MEGA_X86)
		# This prevents usage of SSE2.
		set(CMAKE_CXX_FLAGS_RELEASE "${CMAKE_CXX_FLAGS_RELEASE} /arch:SSE")
		set(CMAKE_C_FLAGS_RELEASE "${CMAKE_C_FLAGS_RELEASE} /arch:SSE")
	endif()
	message(STATUS "CMAKE_CXX_FLAGS_RELEASE: ${CMAKE_CXX_FLAGS_RELEASE}")
	message(STATUS "CMAKE_C_FLAGS_RELEASE: ${CMAKE_C_FLAGS_RELEASE}")
endif()

function(add_move_dll ARG_POST_TARGET ARG_TARGET)
	add_custom_command(TARGET ${ARG_POST_TARGET} POST_BUILD
		COMMAND ${CMAKE_COMMAND} -E copy
		$<TARGET_FILE:${ARG_TARGET}>
		${CMAKE_CURRENT_BINARY_DIR}/$<CONFIGURATION>/$<TARGET_FILE_NAME:${ARG_TARGET}>)
endfunction()

function(add_move_file ARG_POST_TARGET ARG_FILE)
	get_filename_component(TEMP_FILENAME ${ARG_FILE} NAME)
	add_custom_command(TARGET ${ARG_POST_TARGET} POST_BUILD
		COMMAND ${CMAKE_COMMAND} -E copy
		${ARG_FILE}
		${CMAKE_CURRENT_BINARY_DIR}/$<CONFIGURATION>/${TEMP_FILENAME})
endfunction()

function(disable_warnings ARG_TARGET)
	get_target_property(OLD_FLAGS ${ARG_TARGET} COMPILE_FLAGS)
	if (CMAKE_CXX_COMPILER_ID MATCHES "Clang")
		set(NEW_FLAGS -w)
	else ()
		set(NEW_FLAGS -W0)
	endif ()
	if(OLD_FLAGS)
		set(NEW_FLAGS "${OLD_FLAGS} ${NEW_FLAGS}")
	endif()
	set_target_properties(${ARG_TARGET} PROPERTIES COMPILE_FLAGS ${NEW_FLAGS})
endfunction()

# Look for dynamic runtime DLLs.
if(MSVC)
	if((MSVC_VERSION GREATER 1909) AND (MSVC_VERSION LESS 1920))
		set(VSVERSION "141")
		set(VCRUNTIMEVERSION "140")
	elseif(MSVC_VERSION EQUAL 1900)
		set(VSVERSION "140")
		set(VCRUNTIMEVERSION "140")
	elseif(MSVC_VERSION EQUAL 1800)
		set(VSVERSION "120")
		set(VCRUNTIMEVERSION "120")
	elseif(MSVC_VERSION LESS 1800)
		message(WARNING "Visual Studio 2013 (VS12) or newer is required!")
	else()
		message(WARNING "Cannot determine Visual Studio version!")
	endif()

	set(PROGRAMFILES_X86_STR "ProgramFiles(x86)")
	set(PROGRAMFILES_X86 "$ENV{${PROGRAMFILES_X86_STR}}")

	set(VSCOMNTOOLSSTRING "VS${VSVERSION}COMNTOOLS")
	set(VSCOMNTOOLS "$ENV{${VSCOMNTOOLSSTRING}}")

	if(VSCOMNTOOLS STREQUAL "")
		set(VSWHERE_PATH "${PROGRAMFILES_X86}\\Microsoft Visual Studio\\Installer\\vswhere.exe")

		execute_process(COMMAND ${VSWHERE_PATH} "-property" "installationPath" OUTPUT_VARIABLE VS_INSTALL_DIR OUTPUT_STRIP_TRAILING_WHITESPACE)

		if(NOT(VS_INSTALL_DIR STREQUAL ""))
			set(VSCOMNTOOLS "${VS_INSTALL_DIR}\\Common7\\Tools")
		endif()
		message(WARNING ${VSCOMNTOOLS})
	endif()

	if(VSCOMNTOOLS STREQUAL "")
		message(WARNING "Environment variable VSCOMNTOOLS not defined and vswhere.exe could not be found. Is Visual Studio properly installed?")
	else()
		# Changed based on this post https://love2d.org/forums/viewtopic.php?t=85550
		get_filename_component(VS_REDIST_DIR ${VSCOMNTOOLS}/../../VC/Redist/MSVC/14.14.26405/${MEGA_ARCH}/Microsoft.VC${VSVERSION}.CRT ABSOLUTE)
		set(MSVCP_DLL ${VS_REDIST_DIR}/msvcp${VCRUNTIMEVERSION}.dll)
		if(MSVC_VERSION EQUAL 1800)
			set(MSVCR_DLL ${VS_REDIST_DIR}/msvcr${VCRUNTIMEVERSION}.dll)
		else()
			set(MSVCR_DLL ${VS_REDIST_DIR}/vcruntime${VCRUNTIMEVERSION}.dll)
		endif()

		if (EXISTS ${MSVCP_DLL} AND EXISTS ${MSVCR_DLL})
			message(STATUS "Found Visual C and C++ runtime .dll files")
			set(MEGA_MSVC_DLLS ${MSVCP_DLL} ${MSVCR_DLL})
		else()
			message(WARNING "Could not find Visual C and C++ runtime .dll files")
		endif()

		if(NOT(MSVC_VERSION LESS 1900))
			get_filename_component(UCRT_DIR "${PROGRAMFILES_X86}/Windows Kits/10/Redist/ucrt/DLLs/${MEGA_ARCH}" ABSOLUTE)
			if(EXISTS ${UCRT_DIR})
				message(STATUS "Found universal C runtime system component directory")
				file(GLOB UCRT_FILES "${UCRT_DIR}/*.dll")
				set(MEGA_MSVC_DLLS ${MEGA_MSVC_DLLS} ${UCRT_FILES})
			else()
				message(STATUS "Could not find universal C runtime system component directory")
			endif()
		endif()

		# Find vcvarsall.bat.
		get_filename_component(VS_VCVARSALL_BAT ${VSCOMNTOOLS}/../../VC/vcvarsall.bat ABSOLUTE)

		if(NOT(EXISTS ${VS_VCVARSALL_BAT}))
			get_filename_component(VS_VCVARSALL_BAT ${VSCOMNTOOLS}/../../VC/Auxiliary/Build/vcvarsall.bat ABSOLUTE)
		endif()

		if(EXISTS ${VS_VCVARSALL_BAT})
			message(STATUS "Found vcvarsall.bat")
			set(MEGA_MSVC_VCVARSALL_BAT ${VS_VCVARSALL_BAT})

			if(MEGA_X86)
				set(MEGA_MSVC_VCVARSALL_BAT_ARG "x86")
			else()
				set(MEGA_MSVC_VCVARSALL_BAT_ARG "x86_amd64")
			endif()
		else()
			message(WARNING "Could not find vsvarsall.bat")
		endif()
	endif()
endif()


set(MEGA_ZLIB_VER "1.2.8")
set(MEGA_PHYSFS_VER "3.0.1")
set(MEGA_LUA51_VER "5.1.5")
set(MEGA_LUAJIT_VER "2.0.5")
set(MEGA_LIBOGG_VER "1.3.2")
set(MEGA_LIBVORBIS_VER "1.3.5")
set(MEGA_LIBTHEORA_VER "1.1.1")
set(MEGA_MPG123_VER "1.25.6")
set(MEGA_FREETYPE_VER "2.8.1")
set(MEGA_SDL2_VER "2.0.7-2088cd828335")
set(MEGA_OPENAL_VER "1.18.2")
set(MEGA_MODPLUG_VER "0.8.8.4")

set(SKIP_INSTALL_ALL TRUE)

set(ZLIB_FOUND TRUE)
set(ZLIB_LIBRARY zlibstatic)
set(ZLIB_INCLUDE_DIR .)

set(OGG_LIBRARY ogg-static)

message(STATUS "-----------------------------------------------------")
message(STATUS "Configuring: zlib ${MEGA_ZLIB_VER}")
message(STATUS "-----------------------------------------------------")
add_subdirectory("libs/zlib-${MEGA_ZLIB_VER}" ${CMAKE_BINARY_DIR}/zlib)
set(MEGA_ZLIB zlibstatic)

message(STATUS "-----------------------------------------------------")
message(STATUS "Configuring: physfs ${MEGA_PHYSFS_VER}")
message(STATUS "-----------------------------------------------------")
add_subdirectory("libs/physfs-${MEGA_PHYSFS_VER}" ${CMAKE_BINARY_DIR}/physfs)
set(MEGA_PHYSFS physfs-static)

message(STATUS "-----------------------------------------------------")
message(STATUS "Configuring: lua ${MEGA_LUA51_VER}")
message(STATUS "-----------------------------------------------------")
add_subdirectory("libs/lua-${MEGA_LUA51_VER}" ${CMAKE_BINARY_DIR}/lua51)
set(MEGA_LUA51 lua51)

message(STATUS "-----------------------------------------------------")
message(STATUS "Configuring: libogg ${MEGA_LIBOGG_VER}")
message(STATUS "-----------------------------------------------------")
add_subdirectory("libs/libogg-${MEGA_LIBOGG_VER}" ${CMAKE_BINARY_DIR}/libogg)
set(MEGA_LIBOGG ogg-static)

message(STATUS "-----------------------------------------------------")
message(STATUS "Configuring: libvorbis ${MEGA_LIBVORBIS_VER}")
message(STATUS "-----------------------------------------------------")
add_subdirectory("libs/libvorbis-${MEGA_LIBVORBIS_VER}" ${CMAKE_BINARY_DIR}/libvorbis)
set(MEGA_LIBVORBIS vorbis-static)
set(MEGA_LIBVORBISFILE vorbisfile-static)

message(STATUS "-----------------------------------------------------")
message(STATUS "Configuring: libtheora ${MEGA_LIBTHEORA_VER}")
message(STATUS "-----------------------------------------------------")
add_subdirectory("libs/libtheora-${MEGA_LIBTHEORA_VER}" ${CMAKE_BINARY_DIR}/libtheora)
set(MEGA_LIBTHEORA theora-static)

message(STATUS "-----------------------------------------------------")
message(STATUS "Configuring: mpg123 ${MEGA_MPG123_VER}")
message(STATUS "-----------------------------------------------------")
add_subdirectory("libs/mpg123-${MEGA_MPG123_VER}" ${CMAKE_BINARY_DIR}/mpg123)
set(MEGA_MPEG123 mpg123)

message(STATUS "-----------------------------------------------------")
message(STATUS "Configuring: freetype ${MEGA_FREETYPE_VER}")
message(STATUS "-----------------------------------------------------")
add_subdirectory("libs/freetype-${MEGA_FREETYPE_VER}" ${CMAKE_BINARY_DIR}/freetype)
set(MEGA_FREETYPE freetype)

message(STATUS "-----------------------------------------------------")
message(STATUS "Configuring: SDL2 ${MEGA_SDL2_VER}")
message(STATUS "-----------------------------------------------------")
add_subdirectory("libs/SDL2" ${CMAKE_BINARY_DIR}/SDL2)
set(MEGA_SDL2 SDL2)
set(MEGA_SDL2MAIN SDL2main)

message(STATUS "-----------------------------------------------------")
message(STATUS "Configuring: openal-soft ${MEGA_OPENAL_VER}")
message(STATUS "-----------------------------------------------------")
add_subdirectory("libs/openal-soft" ${CMAKE_BINARY_DIR}/openal-soft)
set(MEGA_OPENAL ${OPENAL_LIB_NAME})

message(STATUS "-----------------------------------------------------")
message(STATUS "Configuring: libmodplug ${MEGA_MODPLUG_VER}")
message(STATUS "-----------------------------------------------------")
add_subdirectory("libs/libmodplug-${MEGA_MODPLUG_VER}" ${CMAKE_BINARY_DIR}/libmodplug)
set(MEGA_MODPLUG modplug-static)

# LuaJIT
if(MSVC)
	message(STATUS "-----------------------------------------------------")
	message(STATUS "Configuring: LuaJIT ${MEGA_LUAJIT_VER}")
	message(STATUS "-----------------------------------------------------")
	set(MEGA_LUAJIT_DIR "LuaJIT")

	# Copy LuaJIT source to binary dir. LuaJIT builds in-source,
	# and we don't want to modify the original source tree, so
	# we copy it.
	file(COPY libs/${MEGA_LUAJIT_DIR} DESTINATION libs)

	set(MEGA_LUAJIT_SOURCE_DIR ${CMAKE_BINARY_DIR}/libs/${MEGA_LUAJIT_DIR})

	set(MEGA_LUAJIT_BUILD_BAT "
		@echo off
		call \"${MEGA_MSVC_VCVARSALL_BAT}\" ${MEGA_MSVC_VCVARSALL_BAT_ARG}
		cd \"${MEGA_LUAJIT_SOURCE_DIR}/src\"
		msvcbuild.bat
	")

	file(WRITE ${MEGA_LUAJIT_SOURCE_DIR}/megabuild.bat ${MEGA_LUAJIT_BUILD_BAT})

	ExternalProject_Add(luajit
		SOURCE_DIR ${MEGA_LUAJIT_SOURCE_DIR}
		BUILD_IN_SOURCE 1
		CONFIGURE_COMMAND ""
		BUILD_COMMAND "${MEGA_LUAJIT_SOURCE_DIR}/megabuild.bat"
		INSTALL_COMMAND cmake -E make_directory ${CMAKE_BINARY_DIR}/bin
			COMMAND cmake -E copy ${MEGA_LUAJIT_SOURCE_DIR}/src/lua51.dll ${CMAKE_BINARY_DIR}/bin
			COMMAND cmake -E copy ${MEGA_LUAJIT_SOURCE_DIR}/src/lua51.lib ${CMAKE_BINARY_DIR}/bin)

	set(MEGA_LUAJIT_LIB ${CMAKE_BINARY_DIR}/bin/lua51.lib)
	set(MEGA_LUAJIT_DLL ${CMAKE_BINARY_DIR}/bin/lua51.dll)
	set(MEGA_LUAJIT_INCLUDE ${MEGA_LUAJIT_SOURCE_DIR}/src)

endif()

set(MEGA_3P
	${MEGA_ZLIB}
	${MEGA_PHYSFS}
	${MEGA_LUA51}
	${MEGA_LIBOGG}
	${MEGA_LIBVORBIS}
	${MEGA_LIBVORBISFILE}
	${MEGA_LIBTHEORA}
	${MEGA_MPEG123}
	${MEGA_FREETYPE}
	${MEGA_SDL2}
	${MEGA_SDL2MAIN}
	${MEGA_OPENAL}
	${MEGA_MODPLUG}
)

# Set to directory of love source. Defaults to ./libs/love.
if(NOT MEGA_LOVE)
	set(MEGA_LOVE ${CMAKE_CURRENT_SOURCE_DIR}/libs/love)
endif()

if(EXISTS ${MEGA_LOVE}/CMakeLists.txt)
	message(STATUS "-----------------------------------------------------")
	message(STATUS "Configuring: love")
	message(STATUS "-----------------------------------------------------")
	#set(ARCHIVE_OUTPUT_DIRECTORY  "${CMAKE_CURRENT_BINARY_DIR}/$<CONFIGURATION>")
	add_subdirectory(${MEGA_LOVE} ${CMAKE_BINARY_DIR}/love)

	# Turn off third-party warnings when building with LOVE.
	foreach(MEGA_LIB ${MEGA_3P})
		disable_warnings(${MEGA_LIB})
	endforeach()
else()
	message(STATUS "LOVE was not found")
endif()

link_directories(${SDL_LINK_DIR})

# CEF

# Override the value in cef_variables.cmake
set(CEF_RUNTIME_LIBRARY_FLAG "/MD")

set_property(GLOBAL PROPERTY OS_FOLDERS ON)

get_filename_component(CEF_ROOT
                       "${CMAKE_CURRENT_LIST_DIR}/../cef"
                       ABSOLUTE)
set(CMAKE_MODULE_PATH ${CMAKE_MODULE_PATH} "${CEF_ROOT}/cmake")

find_package(CEF REQUIRED)
add_subdirectory(${CEF_LIBCEF_DLL_WRAPPER_PATH} libcef_dll_wrapper)

PRINT_CEF_CONFIG()

# Ghost

set(GHOST_TARGET "Castle")
set(CMAKE_CXX_FLAGS_RELEASE "${CMAKE_CXX_FLAGS_RELEASE} /MD")
set(CMAKE_CXX_FLAGS_DEBUG "${CMAKE_CXX_FLAGS_DEBUG} /MDd")

set(GHOST_SRCS
  ../win/main.cc
  ../win/ghost_win.cc
  ../win/simple_handler_win.cc
  ../win/json.hpp
  ../win/wintoastlib.cpp
  ../common/ghost.cpp
  ../common/ghost_constants.cpp
  ../common/simple_app.cpp
  ../common/simple_handler.cpp
  ../common/js_binds.cpp
)

ADD_LOGICAL_TARGET("libcef_lib" "${CEF_LIB_DEBUG}" "${CEF_LIB_RELEASE}")
SET_CEF_TARGET_OUT_DIR()

set(CASTLE_RC
		extra/castle.rc
		extra/castle.ico
	)

add_executable(${GHOST_TARGET} WIN32 ${GHOST_SRCS} ${CASTLE_RC})
add_dependencies(${GHOST_TARGET} libcef_dll_wrapper)
SET_EXECUTABLE_TARGET_PROPERTIES(${GHOST_TARGET})
target_link_libraries(${GHOST_TARGET} libcef_lib libcef_dll_wrapper ${CEF_STANDARD_LIBS} liblove ${LOVE_LUA_LIBRARY})
include_directories(
  ../common
  ../cef
  ../win
  ../love/src
)

target_link_libraries(${GHOST_TARGET} ${MEGA_3P})

add_move_dll(${GHOST_TARGET} ${MEGA_MPEG123})
add_move_dll(${GHOST_TARGET} ${MEGA_SDL2})
add_move_dll(${GHOST_TARGET} ${MEGA_OPENAL})
post_step_move_dll(${GHOST_TARGET} ${MEGA_LUAJIT_DLL})

target_compile_definitions(${GHOST_TARGET} PRIVATE ${CEF_COMPILER_DEFINES})

# Add the custom manifest files to the executable.
ADD_WINDOWS_MANIFEST("${CMAKE_CURRENT_SOURCE_DIR}/../win" "${GHOST_TARGET}" "exe")

# Copy binary and resource files to the target output directory.
COPY_FILES("${GHOST_TARGET}" "${CEF_BINARY_FILES}" "${CEF_BINARY_DIR}" "${CEF_TARGET_OUT_DIR}")
COPY_FILES("${GHOST_TARGET}" "${CEF_RESOURCE_FILES}" "${CEF_RESOURCE_DIR}" "${CEF_TARGET_OUT_DIR}")

set(GHOST_FILES
  base
  web
  shared-assets
)
COPY_FILES("${GHOST_TARGET}" "${GHOST_FILES}" "${CMAKE_CURRENT_SOURCE_DIR}/.." "${CEF_TARGET_OUT_DIR}")

#COPY_FILES("${GHOST_TARGET}" "castle.ico" "${CMAKE_CURRENT_SOURCE_DIR}/extra" "${CEF_TARGET_OUT_DIR}")

set(GHOST_MSVC_DLLS concrt140.dll  msvcp140_1.dll  vccorlib140.dll msvcp140.dll   msvcp140_2.dll  vcruntime140.dll)
COPY_FILES("${GHOST_TARGET}" "${GHOST_MSVC_DLLS}" "${CMAKE_CURRENT_SOURCE_DIR}/extra" "${CEF_TARGET_OUT_DIR}")