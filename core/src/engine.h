#pragma once

#include "precomp.h"

#include "lv.h"
#include "variables.h"
#include "tests.h"
#include "archive.h"
#include "bridge.h"
#include "player.h"


class Engine {
  // The top-level instance of Castle core. There should just be one of these for the entire
  // program. Multiplicity of scenes is managed by having multiple `Scene` instances.
  //
  // This class initializes the various modules involved in Castle core and contains the top-level
  // logic run on each frame of the main loop.

public:
  Engine(const Engine &) = delete; // Prevent accidental copies
  const Engine &operator=(const Engine &) = delete;

  Engine();


  // Main loop

  bool frame();


  // Scene data

  bool hasInitialDeck() const;
  void loadSceneFromFile(const char *path);
  void loadSceneFromDeckId(const char *deckId);
  void loadSceneFromCardId(const char *cardId);


  // Bridge access

  Bridge &getBridge();

  Scene &getScene();


private:
  Bridge bridge { *this };
  Lv lv { 800 / 2, 1120 / 2 };

  [[maybe_unused]] bool prevWindowFocused = true;
  [[maybe_unused]] int prevWindowWidth = 0, prevWindowHeight = 0;
  bool shouldQuit = false;

  struct PreInit {
    // Allows us to run some early initialization steps before the rest of the
    // members are initialized.
    PreInit();
  } preInit;

#ifdef CASTLE_ENABLE_TESTS
  Tests tests;
#endif

  // TODO: editing vs. playing
  Player player { bridge, lv };

  void update(double dt);

  void draw();
};


// Inlined implementations

inline Bridge &Engine::getBridge() {
  return bridge;
}

inline Scene &Engine::getScene() {
  return player.getScene();
}
