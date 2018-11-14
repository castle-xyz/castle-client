# Build boost via its bootstrap script. The build tree cannot contain a space.
# This boost b2 build system yields errors with spaces in the name of the
# build dir.
#
if("${CMAKE_CURRENT_BINARY_DIR}" MATCHES " ")
  message(FATAL_ERROR "cannot use boost bootstrap with a space in the name of the build dir")
endif()

if(NOT DEFINED use_bat)
  if(WIN32)
    set(use_bat 1)
  else()
    set(use_bat 0)
  endif()
endif()

if(CMAKE_SIZEOF_VOID_P EQUAL 8)
  set(am 64)
else()
  set(am 32)
endif()

#Always use the static libs on Windows.
if(WIN32)
   set(link static)
   set(Boost_USE_STATIC_LIBS ON)
else()
   if(BUILD_SHARED_LIBS)
      set(link shared)
      set(Boost_USE_STATIC_LIBS OFF)
   else()
      set(link static)
      set(Boost_USE_STATIC_LIBS ON)
   endif(BUILD_SHARED_LIBS)
endif(WIN32)

set(boost_with_args
  --with-date_time
  --with-random
  --with-system
  --link=${link}
)

if(use_bat)
  if(MSVC11)
    set(_toolset "msvc-11.0")
  elseif(MSVC12)
    set(_toolset "msvc-12.0")
  elseif(MSVC14)
    set(_toolset "msvc-14.0")
  endif()

  if(CMAKE_BUILD_TYPE STREQUAL "Debug")
    set(_build_variant "debug")
  else()
    set(_build_variant "release")
  endif()

  list(APPEND boost_with_args
    "--layout=system" "toolset=${_toolset}" "variant=${_build_variant}")

  set(boost_cmds
    CONFIGURE_COMMAND bootstrap.bat
    BUILD_COMMAND b2 address-model=${am} ${boost_with_args}
  )
else()
  list(APPEND boost_with_args
    "cxxflags=-fPIC")
  set(boost_cmds
    CONFIGURE_COMMAND ./bootstrap.sh --prefix=<INSTALL_DIR>
    BUILD_COMMAND ./b2 address-model=${am} ${boost_with_args}
  )
endif(use_bat)

ExternalProject_Add(boost
  DOWNLOAD_DIR ${download_dir}
  URL http://download.sourceforge.net/project/boost/boost/1.61.0/boost_1_61_0.zip
  URL_MD5 015ae4afa6f3e597232bfe1dab949ace
  SOURCE_DIR "${CMAKE_CURRENT_BINARY_DIR}/boost"
  INSTALL_DIR "${GameLiftServerSdk_INSTALL_PREFIX}"
  ${boost_cmds}
  INSTALL_COMMAND ""
  BUILD_IN_SOURCE 1
  CMAKE_CACHE_ARGS
      ${GameLiftServerSdk_DEFAULT_ARGS}
      ${GameLiftServerSdk_THIRDPARTYLIBS_ARGS}
)

ExternalProject_Get_Property(boost install_dir)
set(BOOST_ROOT "${CMAKE_CURRENT_BINARY_DIR}/boost" CACHE INTERNAL "")
set(BOOST_LIB "${BOOST_ROOT}/stage/lib" CACHE INTERNAL "")

list(APPEND GameLiftServerSdk_THIRDPARTYLIBS_ARGS
# Add Boost properties so correct version of Boost is found.
  "-DBOOST_ROOT:PATH=${BOOST_ROOT}"
  "-DBoost_INCLUDE_DIR:PATH=${BOOST_ROOT}"
  "-DBOOST_LIBRARYDIR:PATH=${BOOST_LIB}"
  "-DBoost_NO_SYSTEM_PATHS:BOOL=ON"
  "-DBoost_USE_STATIC_LIBS:BOOL=${Boost_USE_STATIC_LIBS}")

add_custom_command(TARGET boost POST_BUILD
                   COMMAND ${CMAKE_COMMAND} -E copy_directory
                   ${BOOST_LIB} ${GameLiftServerSdk_INSTALL_PREFIX}/lib)
