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

#include "android.h"

#ifdef LOVE_ANDROID

#include "SDL.h"
#include "jni.h"

#include <sys/stat.h>
#include <sys/types.h>
#include <unistd.h>
#include <errno.h>

extern "C" {
#include <lauxlib.h>
#include <lua.h>
#include <lualib.h>
}

#include "modules/thread/Channel.h"

#include "org_love2d_android_Channels.h"

namespace love
{
namespace android
{

void setImmersive(bool immersive_active)
{
	JNIEnv *env = (JNIEnv*) SDL_AndroidGetJNIEnv();

	jobject activity = (jobject) SDL_AndroidGetActivity();

	jclass clazz(env->GetObjectClass(activity));
	jmethodID method_id = env->GetMethodID(clazz, "setImmersiveMode", "(Z)V");

	env->CallVoidMethod(activity, method_id, immersive_active);

	env->DeleteLocalRef(activity);
	env->DeleteLocalRef(clazz);
}

bool getImmersive()
{
	JNIEnv *env = (JNIEnv*) SDL_AndroidGetJNIEnv();

	jobject activity = (jobject) SDL_AndroidGetActivity();

	jclass clazz(env->GetObjectClass(activity));
	jmethodID method_id = env->GetMethodID(clazz, "getImmersiveMode", "()Z");

	jboolean immersive_active = env->CallBooleanMethod(activity, method_id);

	env->DeleteLocalRef(activity);
	env->DeleteLocalRef(clazz);

	return immersive_active;
}

double getScreenScale()
{
	static double result = -1.;

	if (result == -1.)
	{
		JNIEnv *env = (JNIEnv*) SDL_AndroidGetJNIEnv();
		jclass activity = env->FindClass("org/love2d/android/GameActivity");

		jmethodID getMetrics = env->GetStaticMethodID(activity, "getMetrics", "()Landroid/util/DisplayMetrics;");
		jobject metrics = env->CallStaticObjectMethod(activity, getMetrics);
		jclass metricsClass = env->GetObjectClass(metrics);

		result = env->GetFloatField(metrics, env->GetFieldID(metricsClass, "density", "F"));

		env->DeleteLocalRef(metricsClass);
		env->DeleteLocalRef(metrics);
		env->DeleteLocalRef(activity);
	}

	return result;
}

const char *getSelectedGameFile()
{
	static const char *path = NULL;

	if (path)
	{
		delete path;
		path = NULL;
	}

	JNIEnv *env = (JNIEnv*) SDL_AndroidGetJNIEnv();
	jclass activity = env->FindClass("org/love2d/android/GameActivity");

	jmethodID getGamePath = env->GetStaticMethodID(activity, "getGamePath", "()Ljava/lang/String;");
	jstring gamePath = (jstring) env->CallStaticObjectMethod(activity, getGamePath);
	const char *utf = env->GetStringUTFChars(gamePath, 0);
	if (utf)
	{
		path = SDL_strdup(utf);
		env->ReleaseStringUTFChars(gamePath, utf);
	}

	env->DeleteLocalRef(gamePath);
	env->DeleteLocalRef(activity);

	return path;
}

bool openURL(const std::string &url)
{
	JNIEnv *env = (JNIEnv*) SDL_AndroidGetJNIEnv();
	jclass activity = env->FindClass("org/love2d/android/GameActivity");

	jmethodID openURL= env->GetStaticMethodID(activity, "openURL", "(Ljava/lang/String;)V");
	jstring url_jstring = (jstring) env->NewStringUTF(url.c_str());

	env->CallStaticVoidMethod(activity, openURL, url_jstring);

	env->DeleteLocalRef(url_jstring);
	env->DeleteLocalRef(activity);
	return true;
}

void vibrate(double seconds)
{
	JNIEnv *env = (JNIEnv*) SDL_AndroidGetJNIEnv();
	jclass activity = env->FindClass("org/love2d/android/GameActivity");

	jmethodID vibrate_method = env->GetStaticMethodID(activity, "vibrate", "(D)V");
	env->CallStaticVoidMethod(activity, vibrate_method, seconds);

	env->DeleteLocalRef(activity);
}

/*
 * Helper functions for the filesystem module
 */
void freeGameArchiveMemory(void *ptr)
{
	char *game_love_data = static_cast<char*>(ptr);
	delete[] game_love_data;
}

bool loadGameArchiveToMemory(const char* filename, char **ptr, size_t *size)
{
	SDL_RWops *asset_game_file = SDL_RWFromFile(filename, "rb");
	if (!asset_game_file) {
		SDL_Log("Could not find %s", filename);
		return false;
	}

	Sint64 file_size = asset_game_file->size(asset_game_file);
	if (file_size <= 0) {
		SDL_Log("Could not load game from %s. File has invalid file size: %d.", filename, (int) file_size);
		return false;
	}

	*ptr = new char[file_size];
	if (!*ptr) {
		SDL_Log("Could not allocate memory for in-memory game archive");
		return false;
	}

	size_t bytes_copied = asset_game_file->read(asset_game_file, (void*) *ptr, sizeof(char), (size_t) file_size);
	if (bytes_copied != file_size) {
		SDL_Log("Incomplete copy of in-memory game archive!");
		delete[] *ptr;
		return false;
	}

	*size = (size_t) file_size;
	return true;
}

bool directoryExists(const char *path)
{
	struct stat s;
	int err = stat(path, &s);
	if (err == -1)
	{
		if (errno != ENOENT)
			SDL_Log("Error checking for directory %s errno = %d: %s", path, errno, strerror(errno));
		return false;
	}

	return S_ISDIR(s.st_mode);
}

bool mkdir(const char *path)
{
	int err = ::mkdir(path, 0770);
	if (err == -1)
	{
		SDL_Log("Error: Could not create directory %s", path);
		return false;
	}

	return true;
}

bool createStorageDirectories()
{
	std::string internal_storage_path = SDL_AndroidGetInternalStoragePath();

	std::string save_directory = internal_storage_path + "/save";
	if (!directoryExists(save_directory.c_str()) && !mkdir(save_directory.c_str()))
		return false;

	std::string game_directory = internal_storage_path + "/game";
	if (!directoryExists (game_directory.c_str()) && !mkdir(game_directory.c_str()))
		return false;

	return true;
}

bool hasBackgroundMusic()
{
	JNIEnv *env = (JNIEnv*) SDL_AndroidGetJNIEnv();
	jobject activity = (jobject) SDL_AndroidGetActivity();

	jclass clazz(env->GetObjectClass(activity));
	jmethodID method_id = env->GetMethodID(clazz, "hasBackgroundMusic", "()Z");

	jboolean result = env->CallBooleanMethod(activity, method_id);

	env->DeleteLocalRef(activity);
	env->DeleteLocalRef(clazz);

	return result;
}

const char *getGhostRootUri()
{
    static const char *path = NULL;

    if (path)
    {
        delete path;
        path = NULL;
    }

    JNIEnv *env = (JNIEnv*) SDL_AndroidGetJNIEnv();
    jclass activity = env->FindClass("org/love2d/android/GameActivity");

    jmethodID getGhostRootUri = env->GetStaticMethodID(activity, "getGhostRootUri", "()Ljava/lang/String;");
    jstring ghostRootUri = (jstring) env->CallStaticObjectMethod(activity, getGhostRootUri);
    const char *utf = env->GetStringUTFChars(ghostRootUri, 0);
    if (utf)
    {
        path = SDL_strdup(utf);
        env->ReleaseStringUTFChars(ghostRootUri, utf);
    }

    env->DeleteLocalRef(ghostRootUri);
    env->DeleteLocalRef(activity);

    return path;
}

double getGhostScreenScaling()
{
	JNIEnv *env = (JNIEnv*) SDL_AndroidGetJNIEnv();
	jclass activity = env->FindClass("org/love2d/android/GameActivity");

	jmethodID getGhostScreenScaling = env->GetStaticMethodID(activity, "getGhostScreenScaling", "()D");
	double screenScaling = (jdouble) env->CallStaticDoubleMethod(activity, getGhostScreenScaling);

	env->DeleteLocalRef(activity);

	return screenScaling;
}

bool getGhostApplyScreenScaling()
{
	JNIEnv *env = (JNIEnv*) SDL_AndroidGetJNIEnv();
	jclass activity = env->FindClass("org/love2d/android/GameActivity");

	jmethodID getGhostApplyScreenScaling = env->GetStaticMethodID(activity, "getGhostApplyScreenScaling", "()Z");
	bool applyScreenScaling = (jboolean) env->CallStaticBooleanMethod(activity, getGhostApplyScreenScaling);

	env->DeleteLocalRef(activity);

	return applyScreenScaling;
}

} // android
} // love

// XXX(Ghost): Added for access to `Channel`s from Java

#define STATIC_METHOD(retType, methodName) \
    extern "C" JNIEXPORT retType JNICALL Java_org_love2d_android_Channels_ ## methodName

#define GET_CHANNEL() \
    auto cName = env->GetStringUTFChars(jName, nullptr); \
    auto channel = love::thread::Channel::getChannel(cName); \
    env->ReleaseStringUTFChars(jName, cName)

static jstring jstringFromVariant(JNIEnv *env, love::Variant &var) {
    if (var.getType() != love::Variant::STRING &&
        var.getType() != love::Variant::SMALLSTRING) {
        return nullptr;
    }

    static lua_State *conversionLuaState = nullptr;
    if (!conversionLuaState) {
        conversionLuaState = luaL_newstate();
    }

    var.toLua(conversionLuaState);
    jstring jResult = env->NewStringUTF(luaL_checkstring(conversionLuaState, -1));
    lua_pop(conversionLuaState, 1);

    return jResult;
}

STATIC_METHOD(void, nativeClear)(JNIEnv *env, jclass, jstring jName) {
    GET_CHANNEL();

    channel->clear();
}

STATIC_METHOD(jstring, nativeDemand)(JNIEnv *env, jclass, jstring jName, jdouble jTimeout) {
    GET_CHANNEL();

    love::Variant var;
    bool result;
    if (jTimeout >= 0) {
        result = channel->demand(&var, jTimeout);
    } else {
        result = channel->demand(&var);
    }

    if (result) {
        return jstringFromVariant(env, var);
    } else {
        return nullptr;
    }
}

STATIC_METHOD(jint, nativeGetCount)(JNIEnv *env, jclass, jstring jName) {
    GET_CHANNEL();

    return channel->getCount();
}

STATIC_METHOD(jboolean, nativeHasRead)(JNIEnv *env, jclass, jstring jName, jint jId) {
    GET_CHANNEL();

    return channel->hasRead(jId);
}

STATIC_METHOD(jstring, nativePeek)(JNIEnv *env, jclass, jstring jName) {
    GET_CHANNEL();

    love::Variant var;
    if (channel->peek(&var)) {
        return jstringFromVariant(env, var);
    } else {
        return nullptr;
    }
}

STATIC_METHOD(jstring, nativePop)(JNIEnv *env, jclass, jstring jName) {
    GET_CHANNEL();

    love::Variant var;
    if (channel->pop(&var)) {
        return jstringFromVariant(env, var);
    } else {
        return nullptr;
    }
}

STATIC_METHOD(jint, nativePush)(JNIEnv *env, jclass, jstring jName, jstring jValue) {
    GET_CHANNEL();

    auto cValue = env->GetStringUTFChars(jValue, NULL);
    auto var = love::Variant(cValue, env->GetStringUTFLength(jValue));
    env->ReleaseStringUTFChars(jValue, cValue);

    return channel->push(var);
}

STATIC_METHOD(jboolean, nativeSupply)(JNIEnv *env, jclass, jstring jName, jstring jValue, jdouble jTimeout) {
    GET_CHANNEL();

    auto cValue = env->GetStringUTFChars(jValue, NULL);
    auto var = love::Variant(cValue, env->GetStringUTFLength(jValue));
    env->ReleaseStringUTFChars(jValue, cValue);

    bool result;
    if (jTimeout >= 0) {
        result = channel->supply(var, jTimeout);
    } else {
        result = channel->supply(var);
    }

    return result;
}

#endif // LOVE_ANDROID
