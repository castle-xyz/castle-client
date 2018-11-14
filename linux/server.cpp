/**
 * Copyright (c) 2006-2018 LOVE Development Team
 *
 * This software is provided 'as-is', without any express or implied
 * warranty.  In no event will the authors be held liable for any damages
 * arising from the use of this software.
 *
 * Permission is granted to anyone to use this software for any purpose,
 * including commercial applications, and to alter it and redistribute it
 * freely, subject to the following restrictions:
 *
 * 1. The origin of this software must not be misrepresented; you must not
 *    claim that you wrote the original software. If you use this software
 *    in a product, an acknowledgment in the product documentation would be
 *    appreciated but is not required.
 * 2. Altered source versions must be plainly marked as such, and must not be
 *    misrepresented as being the original software.
 * 3. This notice may not be removed or altered from any source distribution.
 **/

// This is just for the editor
#ifndef GAMELIFT_USE_STD
#define GAMELIFT_USE_STD 1
#endif

#include "common/version.h"
#include "modules/love/love.h"
#include <SDL.h>
#include <string>
#include <iostream>
#include <signal.h>
#include <stdlib.h>
#include <stdio.h>
#include <unistd.h>
#include "aws/gamelift/server/GameLiftServerAPI.h"
#include "aws/gamelift/server/LogParameters.h"
#include "aws/gamelift/server/ProcessParameters.h"

#ifdef LOVE_BUILD_EXE

#define PORT 22122

using namespace Aws::GameLift::Server;

// Lua
extern "C" {
	#include <lua.h>
	#include <lualib.h>
	#include <lauxlib.h>
}

static int love_preload(lua_State *L, lua_CFunction f, const char *name)
{
	lua_getglobal(L, "package");
	lua_getfield(L, -1, "preload");
	lua_pushcfunction(L, f);
	lua_setfield(L, -2, name);
	lua_pop(L, 2);
	return 0;
}

enum DoneAction
{
	DONE_QUIT,
	DONE_RESTART,
};

static bool sShouldQuit = false;
static std::string sCastleUrl;
void my_handler(int s) {
    printf("Caught signal %d\n",s);
    sShouldQuit = true;
}

// from https://gist.github.com/5at/3671566
static int l_my_print(lua_State* L) {
    int nargs = lua_gettop(L);
    std::cout << "  ";
    for (int i=1; i <= nargs; ++i) {
		std::cout << lua_tostring(L, i);
    }
    std::cout << std::endl;

    return 0;
}

static const struct luaL_Reg printlib [] = {
  {"print", l_my_print},
  {NULL, NULL} /* end of array */
};

static DoneAction runlove(int argc, char **argv, int &retval)
{
	while (sCastleUrl.empty() && !sShouldQuit) {
		sleep(10);
	}
	if (sShouldQuit) {
		return DONE_QUIT;
	}

	// Create the virtual machine.
	lua_State *L = luaL_newstate();
	luaL_openlibs(L);

	// Add love to package.preload for easy requiring.
	love_preload(L, luaopen_love, "love");

	// Add command line arguments to global arg (like stand-alone Lua).
	{
		lua_newtable(L);

        lua_pushstring(L, "love");
        lua_rawseti(L, -2, -2);

		lua_pushstring(L, "embedded boot.lua");
		lua_rawseti(L, -2, -1);

        std::string::size_type pos = std::string(argv[0]).find_last_of("\\/");
        std::string path = std::string(argv[0]).substr(0, pos) + "/base";

        printf("Castle lua path: %s\n", path.c_str());
        lua_pushstring(L, path.c_str());
        lua_rawseti(L, -2, 0);

		lua_setglobal(L, "arg");
	}

	// require "love"
	lua_getglobal(L, "require");
	lua_pushstring(L, "love");
	lua_call(L, 1, 1); // leave the returned table on the stack.

	// Add love._exe = true.
	// This indicates that we're running the standalone version of love, and not
	// the library version.
	{
		lua_pushboolean(L, 1);
		lua_setfield(L, -2, "_exe");
	}

	// Pop the love table returned by require "love".
	lua_pop(L, 1);

	// require "love.boot" (preloaded when love was required.)
	lua_getglobal(L, "require");
	lua_pushstring(L, "love.boot");
	lua_call(L, 1, 1);

	// Turn the returned boot function into a coroutine and call it until done.
	lua_newthread(L);
	lua_pushvalue(L, -2);

    lua_pushstring(L, sCastleUrl.c_str());
    lua_setglobal(L, "GHOST_ROOT_URI");

    // Add custom print lib
    lua_getglobal(L, "_G");
	luaL_register(L, NULL, printlib);
	lua_pop(L, 1);

	// TODO: should actually test whether lua is finished initializing
	struct timespec start, finish;
	double elapsed;
	clock_gettime(CLOCK_MONOTONIC, &start);
	bool hasActivatedGameSession = false;

	int stackpos = lua_gettop(L);
	while (lua_resume(L, 0) == LUA_YIELD) {
		if (!hasActivatedGameSession) {
			clock_gettime(CLOCK_MONOTONIC, &finish);
			elapsed = (finish.tv_sec - start.tv_sec);
			elapsed += (finish.tv_nsec - start.tv_nsec) / 1000000000.0;

			if (elapsed > 5) {
				hasActivatedGameSession = true;
				ActivateGameSession();
			}
		}

        if (sShouldQuit) {
            return DONE_QUIT;
        }

		lua_pop(L, lua_gettop(L) - stackpos);
    }

	retval = 0;
	DoneAction done = DONE_QUIT;

	// if love.boot() returns "restart", we'll start up again after closing this
	// Lua state.
	if (lua_type(L, -1) == LUA_TSTRING && strcmp(lua_tostring(L, -1), "restart") == 0)
		done = DONE_RESTART;
	if (lua_isnumber(L, -1))
		retval = (int) lua_tonumber(L, -1);

	lua_close(L);

	return done;
}

const std::function<void(Model::GameSession)> onStartGameSession = [](Model::GameSession session) {
	std::vector<Model::GameProperty> properties = session.GetGameProperties();
	std::vector<Model::GameProperty>::iterator it;
	std::string castleUrl;
	for (it = properties.begin(); it != properties.end(); it++)    {
		Model::GameProperty property = *it;
		if (property.GetKey() == "castleUrl") {
			castleUrl = property.GetValue();
		}
	}

	if (castleUrl.empty()) {
		sShouldQuit = true;
		return;
	}

	sCastleUrl = castleUrl;
};

const std::function<void()> onProcessTerminate = []() {
	sShouldQuit = true;
};

const std::function<bool()> onHealthCheck = []() {
	return !sShouldQuit;
};

int main(int argc, char **argv)
{
	if (strcmp(LOVE_VERSION_STRING, love_version()) != 0)
	{
		printf("Version mismatch detected!\nLOVE binary is version %s\n"
			   "LOVE library is version %s\n", LOVE_VERSION_STRING, love_version());
		return 1;
	}

    if (argc != 1) {
        printf("Does not take any args\n");
		return 1;
    }

    struct sigaction sigIntHandler;
    sigIntHandler.sa_handler = my_handler;
    sigemptyset(&sigIntHandler.sa_mask);
    sigIntHandler.sa_flags = 0;
    sigaction(SIGINT, &sigIntHandler, NULL);

	LogParameters logParameters;
	ProcessParameters gameLiftParams(onStartGameSession, onProcessTerminate, onHealthCheck, PORT, logParameters);

	InitSDK();
	ProcessReady(gameLiftParams);

	int retval = 0;
	DoneAction done = DONE_QUIT;

	do {
		done = runlove(argc, argv, retval);
	} while (done != DONE_QUIT);

	return retval;
}

#endif // LOVE_BUILD_EXE