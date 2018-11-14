option(USE_SYSTEM_BOOST "Should we use the system Boost?" OFF)
option(USE_SYSTEM_SIOCLIENT "Should we use the system socket.io client?" OFF)
option(USE_SYSTEM_PROTOBUF "Should we use the system protobuf?" OFF)

if(USE_SYSTEM_BOOST)
  find_package(Boost COMPONENTS date_time random system REQUIRED)
  list(APPEND GameLiftServerSdk_THIRDPARTYLIBS_ARGS
    "-DBoost_INCLUDE_DIR:PATH=${Boost_INCLUDE_DIR}"
    "-DBOOST_LIBRARYDIR:PATH=${Boost_LIBRARY_DIR}")
else()
  include(External_boost)
endif(USE_SYSTEM_BOOST)

if(USE_SYSTEM_SIOCLIENT)
  find_package(sioclient REQUIRED)
else()
  include(External_sioclient)
endif(USE_SYSTEM_SIOCLIENT)

if(USE_SYSTEM_PROTOBUF)
  find_package(Protobuf REQUIRED)
else()
  include(External_protobuf)
endif(USE_SYSTEM_PROTOBUF)

set(GameLiftServerSdk_THIRDPARTYLIBS_ARGS "${GameLiftServerSdk_THIRDPARTYLIBS_ARGS}"
  PARENT_SCOPE)
