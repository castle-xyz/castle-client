Download https://www.boost.org/users/history/version_1_67_0.html and extract to boost_1_67_0
`cd boost_1_67_0/`
`./bootstrap.sh --prefix=../build`
`./b2 install --with-filesystem link=static runtime-link=static`

Current config:

```
    - atomic                   : not building
    - chrono                   : not building
    - container                : not building
    - context                  : not building
    - contract                 : not building
    - coroutine                : not building
    - date_time                : not building
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
    - regex                    : not building
    - serialization            : not building
    - signals                  : not building
    - stacktrace               : not building
    - system                   : not building
    - test                     : not building
    - thread                   : not building
    - timer                    : not building
    - type_erasure             : not building
    - wave                     : not building
```
