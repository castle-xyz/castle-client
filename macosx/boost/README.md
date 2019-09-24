Download https://www.boost.org/users/history/version_1_67_0.html and extract to boost_1_67_0
`cd boost_1_67_0/`
`./bootstrap.sh --prefix=../build`
`./b2 install --with-filesystem --with-date_time --with-regex --with-chrono --with-thread link=static runtime-link=static`

Right click on boost/lib in xcode and select "Add files to ghost"

Current config:

```
    - atomic                   : not building
    - chrono                   : building
    - container                : not building
    - context                  : not building
    - contract                 : not building
    - coroutine                : not building
    - date_time                : building
    - exception                : not building
    - fiber                    : not building
    - filesystem               : building
    - graph                    : not building
    - graph_parallel           : not building
    - iostreams                : not building
    - locale                   : not building
    - log                      : not building
    - math                     : not building
    - mpi                      : not building
    - program_options          : not building
    - python                   : not building
    - random                   : not building
    - regex                    : building
    - serialization            : not building
    - signals                  : not building
    - stacktrace               : not building
    - system                   : not building
    - test                     : not building
    - thread                   : building
    - timer                    : not building
    - type_erasure             : not building
    - wave                     : not building
```
