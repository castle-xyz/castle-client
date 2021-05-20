#pragma once

#include "precomp.h"

#include "lv.h"
#include "library.h"
#include "props.h"
#include "gesture.h"
#include "variables.h"
#include "sound.h"


class AllBehaviors; // Forward declaration otherwise this would be circular...

using ActorId = entt::entity; // Is unique throughout a `Scene`'s lifetime, never recycled
constexpr auto nullActor = entt::null; // An `ActorId`-compatible sentinel value
using ActorIdSet = entt::sparse_set; // Good for fast membership checks and maintaining a set of
                                     // `ActorId`s over a long time (eg. in `TagsBehavior`). Might
                                     // take up a lot of memory / may have heavy lifecycle cost.

class Scene {
  // Maintains the runtime state of a single Castle scene. This involves managing actor creation and
  // destruction, draw orders, managing behavior instances and the membership of actors in
  // behaviors. Also provides top-level methods for drawing and updating the whole scene.

public:
  Scene(const Scene &) = delete; // Prevent accidental copies
  const Scene &operator=(const Scene &) = delete;

  explicit Scene(Variables &variables_, Reader *maybeReader = nullptr);
  ~Scene();


  // Actor management

  struct ActorDesc {
    Reader *reader = nullptr;
    const char *parentEntryId = nullptr;
    enum DrawOrderRelativity { BehindAll, Behind, FrontOf, FrontOfAll };
    DrawOrderRelativity drawOrderRelativity = FrontOfAll;
    ActorId drawOrderRelativeTo = nullActor;
  };
  ActorId addActor(const ActorDesc &params);
  void removeActor(ActorId actorId);
  bool hasActor(ActorId actorId) const; // Whether `actorId` exists. Always `false` for `nullActor`.
                                        // may move as actors are added / removed.
  template<typename F>
  void forEachActor(F &&f) const; // `f` must take `(ActorId)`
  int numActors() const;
  ActorId indexActor(int index) const; // Order maintained as long as actors not added / removed.
                                       // `nullActor` if out of bounds.


  // Draw order
  struct DrawOrder {
    int value = -1;
    int tieBreak = 0;
    bool operator<(const DrawOrder &other) const;
  };
  inline static const DrawOrder minDrawOrder { -1, 0 };
  const DrawOrder *maybeGetDrawOrder(ActorId actorId) const; // `nullptr` if invalid. Shortlived,
                                                             // may move as actors added / removed.
  void ensureDrawOrderSort() const;
  template<typename F>
  void forEachActorByDrawOrder(F &&f) const; // `f` must take `(ActorId)`


  // Behaviors

  AllBehaviors &getBehaviors();
  const AllBehaviors &getBehaviors() const;


  // Physics

  b2World &getPhysicsWorld();
  const b2World &getPhysicsWorld() const;
  b2Body *getPhysicsBackgroundBody();
  int numPhysicsStepsPerformed() const; // Number of 120Hz physics steps performed in this frame


  // Entity registry (entt instance managing component data)

  entt::registry &getEntityRegistry();
  const entt::registry &getEntityRegistry() const;


  // Library

  Library &getLibrary();
  const Library &getLibrary() const;


  // View, camera

  const love::Transform &getViewTransform() const;
  love::Vector2 inverseViewTransformPoint(const love::Vector2 &point) const;
  float getViewScale() const;
  float getPixelScale() const;

  void setCameraTarget(ActorId target);
  love::Vector2 getCameraPosition() const;
  love::Vector2 getCameraSize() const;


  // Gesture

  const Gesture &getGesture() const;


  // Variables

  Variables &getVariables();
  const Variables &getVariables() const;


  // Sound

  Sound &getSound();
  const Sound &getSound() const;


  // Scene-level props

  struct Props {
    PROP(love::Colorf, backgroundColor) = { 227 / 255.0, 230 / 255.0, 252 / 255.0, 1 };
    PROP(int, coordinateSystemVersion) = 0;
  } props;


  // Time

  double getPerformTime() const; // Time under performance since start, not including time paused


  // RNG

  love::RandomGenerator &getRNG();


  // Restarting

  void requestRestart();
  bool isRestartRequested() const;


  // Update, draw

  void update(double dt);

  void draw() const;


private:
  Lv &lv { Lv::getInstance() };
  Variables &variables;
  Sound sound;

  entt::registry registry;

  entt::basic_view<entt::entity, entt::exclude_t<>, DrawOrder> drawOrderView
      = registry.view<DrawOrder>();
  static constexpr auto backDrawOrder = 0; // Always less than draw order value of any actor
  mutable int frontDrawOrder = 1; // Always greater than draw order value of any actor
  static constexpr auto initialDrawOrderTieBreak
      = std::numeric_limits<int>::max() - 32; // `- 32` to stay away from overflow
  mutable int nextDrawOrderTieBreak = initialDrawOrderTieBreak; // Start near max, move toward zero
  mutable bool needDrawOrderSort = false;

  struct PhysicsContactListener : b2ContactListener {
    Scene &scene;
    explicit PhysicsContactListener(Scene &scene_);
    void BeginContact(b2Contact *contact) override;
  } physicsContactListener; // Must outlive `physicsWorld` below
  b2World physicsWorld { b2Vec2(0, 9.8) };
  b2Body *physicsBackgroundBody = nullptr;
  int nPhysicsStepsPerformed = 0;
  double physicsUpdateTimeRemaining = 0;

  std::unique_ptr<AllBehaviors> behaviors;

  Library library; // Library instance maintained at scene level for now

  float viewWidth = 10.0, viewHeight = 7.0f * viewWidth / 5.0f;
  mutable love::Transform viewTransform;
  mutable float cameraX = 0, cameraY = 0;
  mutable ActorId cameraTarget = nullActor;

  Gesture gesture { *this };

  double performTime = 0;

  love::RandomGenerator rng;

  bool restartRequested = false;


  void read(Reader &reader);
};


// Inlined implementations

inline bool Scene::hasActor(ActorId actorId) const {
  return registry.valid(actorId);
}

template<typename F>
void Scene::forEachActor(F &&f) const {
  drawOrderView.each([&](ActorId actorId, const DrawOrder &order) {
    f(actorId);
  });
}

inline int Scene::numActors() const {
  return drawOrderView.size();
}

inline ActorId Scene::indexActor(int index) const {
  if (0 <= index && index < int(drawOrderView.size())) {
    return drawOrderView.data()[index];
  } else {
    return nullActor;
  }
}

inline const Scene::DrawOrder *Scene::maybeGetDrawOrder(ActorId actorId) const {
  return registry.valid(actorId) && drawOrderView.contains(actorId)
      ? &std::get<0>(drawOrderView.get(actorId))
      : nullptr;
}

inline bool Scene::DrawOrder::operator<(const DrawOrder &other) const {
  return std::tie(value, tieBreak) < std::tie(other.value, other.tieBreak);
}

template<typename F>
inline void Scene::forEachActorByDrawOrder(F &&f) const {
  ensureDrawOrderSort();
  forEachActor(std::forward<F>(f));
}

inline AllBehaviors &Scene::getBehaviors() {
  return *behaviors;
}

inline const AllBehaviors &Scene::getBehaviors() const {
  return *behaviors;
}

inline b2World &Scene::getPhysicsWorld() {
  return physicsWorld;
}

inline const b2World &Scene::getPhysicsWorld() const {
  return physicsWorld;
}

inline b2Body *Scene::getPhysicsBackgroundBody() {
  return physicsBackgroundBody;
}

inline int Scene::numPhysicsStepsPerformed() const {
  return nPhysicsStepsPerformed;
}

inline entt::registry &Scene::getEntityRegistry() {
  return registry;
}

inline const entt::registry &Scene::getEntityRegistry() const {
  return registry;
}

inline Library &Scene::getLibrary() {
  return library;
}

inline const Library &Scene::getLibrary() const {
  return library;
}

inline const love::Transform &Scene::getViewTransform() const {
  return viewTransform;
}

inline love::Vector2 Scene::inverseViewTransformPoint(const love::Vector2 &point) const {
  return viewTransform.inverseTransformPoint(point);
}

inline float Scene::getViewScale() const {
  return viewTransform.getMatrix().getElements()[0]; // Assuming no rotation
}

inline float Scene::getPixelScale() const {
  return float(lv.window.getDPIScale() / getViewScale());
}

inline void Scene::setCameraTarget(ActorId target) {
  cameraTarget = target;
}

inline love::Vector2 Scene::getCameraPosition() const {
  return { cameraX, cameraY };
}

inline love::Vector2 Scene::getCameraSize() const {
  return { viewWidth, viewHeight };
}

inline Variables &Scene::getVariables() {
  return variables;
}

inline const Variables &Scene::getVariables() const {
  return variables;
}

inline Sound &Scene::getSound() {
  return sound;
}

inline const Sound &Scene::getSound() const {
  return sound;
}

inline const Gesture &Scene::getGesture() const {
  return gesture;
}

inline double Scene::getPerformTime() const {
  return performTime;
}

inline love::RandomGenerator &Scene::getRNG() {
  return rng;
}

inline void Scene::requestRestart() {
  restartRequested = true;
}

inline bool Scene::isRestartRequested() const {
  return restartRequested;
}
