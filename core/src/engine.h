#pragma once

#include "precomp.h"

#include "lv.h"
#include "scene.h"
#include "tests.h"


class Engine {
  // The top-level instance of Castle core. There should just be one of these
  // for the entire program. Multiplicity of scenes is managed by having
  // multiple `Scene` instances.
  //
  // This class initializes the various modules involved in Castle core and
  // contains the top-level logic run on each frame of the main loop.

public:
  Engine(const Engine &) = delete; // Prevent accidental copies
  const Engine &operator=(const Engine &) = delete;

  explicit Engine(std::string scenePath_);

  // Run one frame of the main loop. Return `false` if we should quit.
  bool frame();

  void reloadFromFile();


private:
  std::string scenePath;

  Lv lv { 800 / 2, 1120 / 2 };
  love::RandomGenerator rng; // TODO(nikki): Seed this

  [[maybe_unused]] bool prevWindowFocused = true;
  [[maybe_unused]] int prevWindowWidth = 0, prevWindowHeight = 0;
  bool shouldQuit = false;

  std::unique_ptr<love::Font> debugFont { lv.graphics.newDefaultFont(
      14, love::TrueTypeRasterizer::HINTING_NORMAL) };


  struct PreInit {
    // Allows us to run some early initialization steps before the rest of the
    // members are initialized.
    PreInit();
  } preInit;

#ifdef CASTLE_ENABLE_TESTS
  Tests tests;
#endif

  std::unique_ptr<Scene> scene;

  void update(double dt);

  void draw();
};
