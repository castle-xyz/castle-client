# Find the sioclient library
#
# Defines:
#
#  SIOCLIENT_FOUND        - system has sioclient
#  SIOCLIENT_INCLUDE_DIRS - the sioclient include directories
#  SIOCLIENT_LIBRARIES    - the sioclient libraries
#

find_path(SIOCLIENT_INCLUDE_DIR
          NAMES sio_client.h
          PATH_SUFFIXES sioclient)

find_library(SIOCLIENT_LIBRARY
             NAMES sioclient)


set(SIOCLIENT_INCLUDE_DIRS ${SIOCLIENT_INCLUDE_DIR})
set(SIOCLIENT_LIBRARIES ${SIOCLIENT_LIBRARY})

include(FindPackageHandleStandardArgs)
find_package_handle_standard_args(SIOCLIENT DEFAULT_MSG
  SIOCLIENT_INCLUDE_DIR SIOCLIENT_LIBRARY)

mark_as_advanced(SIOCLIENT_INCLUDE_DIR SIOCLIENT_LIBRARY)
