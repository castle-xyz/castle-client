#----------------------------------------------------------------
# Generated CMake target import file for configuration "RelWithDebInfo".
#----------------------------------------------------------------

# Commands may need to know the format version.
set(CMAKE_IMPORT_FILE_VERSION 1)

# Import target "libobs" for configuration "RelWithDebInfo"
set_property(TARGET libobs APPEND PROPERTY IMPORTED_CONFIGURATIONS RELWITHDEBINFO)
set_target_properties(libobs PROPERTIES
  IMPORTED_LOCATION_RELWITHDEBINFO "${_IMPORT_PREFIX}/bin/libobs.0.dylib"
  IMPORTED_SONAME_RELWITHDEBINFO "@rpath/libobs.0.dylib"
  )

list(APPEND _IMPORT_CHECK_TARGETS libobs )
list(APPEND _IMPORT_CHECK_FILES_FOR_libobs "${_IMPORT_PREFIX}/bin/libobs.0.dylib" )

# Commands beyond this point should not need to know the version.
set(CMAKE_IMPORT_FILE_VERSION)
