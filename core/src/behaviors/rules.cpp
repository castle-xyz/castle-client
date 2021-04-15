#include "rules.h"

#include "behaviors/all.h"


//
// Lifecycle triggers
//

struct CreateTrigger : BaseTrigger {
  inline static const RuleRegistration<CreateTrigger> registration { "create", 16 };

  struct Params {
  } params;
};

struct DestroyTrigger : BaseTrigger {
  inline static const RuleRegistration<DestroyTrigger> registration { "destroy", 16 };

  struct Params {
  } params;
};


//
// Lifecycle responses
//

struct CreateResponse final : BaseResponse {
  inline static const RuleRegistration<CreateResponse> registration { "create", 16 };

  struct Params {
    PROP(std::string, entryId);
    PROP(std::string, coordinateSystem) = "relative position";
    PROP(float, xOffset) = 0;
    PROP(float, yOffset) = 0;
    PROP(float, xAbsolute) = 0;
    PROP(float, yAbsolute) = 0;
    PROP(float, angle) = 0;
    PROP(float, distance) = 0;
    PROP(std::string, depth) = "in front of all actors";
  } params;

  ResponseRef realNext = nullptr;

  void run(const RuleContext &ctx) override {
    auto &scene = ctx.getScene();

    // Make sure we have an `entryId`
    auto &entryId = params.entryId();
    if (entryId.empty()) {
      return;
    }

    // Create actor and make sure that was successful
    auto newActorId = scene.addActor(nullptr, entryId.c_str());
    if (newActorId == nullActor) {
      return;
    }

    // TODO(nikki): Handle depth

    // Set position
    auto &bodyBehavior = scene.getBehaviors().byType<BodyBehavior>();
    if (auto newBody = bodyBehavior.maybeGetPhysicsBody(newActorId)) {
      // Check coordinate system by looking at a couple characters of the string...
      auto &coordinateSystem = params.coordinateSystem();
      if (coordinateSystem[0] == 'r') {
        auto creatorPos = b2Vec2(0, 0);
        float creatorAngle = 0;
        if (auto creatorBody = bodyBehavior.maybeGetPhysicsBody(ctx.actorId)) {
          creatorPos = creatorBody->GetPosition();
          creatorAngle = creatorBody->GetAngle();
        }
        if (coordinateSystem[9] == 'p') {
          // Relative position
          newBody->SetTransform(
              {
                  creatorPos.x + params.xOffset(),
                  creatorPos.y + params.yOffset(),
              },
              newBody->GetAngle());
        } else {
          // TODO(nikki): Relative angle and distance
        }
      } else {
        // TODO(nikki): Absolute position
      }
    }
    // TODO(nikki): Handle absolute position
  }
};


//
// Timing responses
//

struct WaitResponse final : BaseResponse {
  inline static const RuleRegistration<WaitResponse> registration { "wait", 16 };

  struct Params {
    PROP(double, duration);
  } params;

  ResponseRef realNext = nullptr;

  void run(const RuleContext &ctx) override {
    // Save `next` to `realNext` and then unset `next` so `BaseResponse` doesn't automatically
    // continue down the chain in `runChain()`. We'll schedule `realNext` ourselves.
    if (next) {
      realNext = next;
      next = nullptr;
    }
    auto &scene = ctx.getScene();
    auto &rulesBehavior = scene.getBehaviors().byType<RulesBehavior>();
    rulesBehavior.schedule(realNext, ctx.copy(), scene.getPerformTime() + params.duration());
  }
};


//
// Meta responses
//

struct NoteResponse final : BaseResponse {
  inline static const RuleRegistration<NoteResponse> registration { "note", 16 };

  struct Params {
    // NOTE: Skipping because we don't actually use it when running, so avoid parsing overhead
    // PROP(std::string, note);
  } params;

  void run(const RuleContext &ctx) override {
    // Nothing to do...
  }
};


//
// Constructor, destructor
//

RulesBehavior::~RulesBehavior() {
  // Call destructors on pool-allocated objects
  for (auto response : responses) {
    response->~BaseResponse();
  }
}


//
// Lifecycle
//

void RulesBehavior::handlePreRemoveActor(ActorId actorId, RulesComponent &component) {
  fire<DestroyTrigger>(actorId);
}


//
// Read, write
//

void RulesBehavior::handleReadComponent(
    ActorId actorId, RulesComponent &component, Reader &reader) {
  reader.each("rules", [&]() {
    // Response
    ResponseRef response = nullptr;
    reader.obj("response", [&]() {
      auto jsonPtr = (void *)reader.jsonValue();
      if (auto found = responseCache.find(jsonPtr); found != responseCache.end()) {
        // Found a pre-existing response for this JSON
        response = found->second;
      } else {
        // New JSON -- read and cache it
        response = readResponse(reader);
        responseCache.insert_or_assign(jsonPtr, response);
      }
    });
    if (!response) {
      return; // Failed to load response
    }

    // Trigger
    reader.obj("trigger", [&]() {
      // Find loader by name and behavior id
      if (auto maybeName = reader.str("name")) {
        if (auto maybeBehaviorId = reader.num("behaviorId")) {
          auto nameHash = entt::hashed_string(*maybeName).value();
          for (auto &loader : triggerLoaders) {
            if (loader.behaviorId == *maybeBehaviorId && nameHash == loader.nameHs.value()
                && !std::strcmp(*maybeName, loader.nameHs.data())) {
              loader.read(getScene(), actorId, response, reader);
              break;
            }
          }
        }
      }
    });
  });
}

ResponseRef RulesBehavior::readResponse(Reader &reader) {
  // Find loader by name and behavior id
  if (auto maybeName = reader.str("name")) {
    if (auto maybeBehaviorId = reader.num("behaviorId")) {
      auto nameHash = entt::hashed_string(*maybeName).value();
      for (auto &loader : responseLoaders) {
        if (loader.behaviorId == *maybeBehaviorId && nameHash == loader.nameHs.value()
            && !std::strcmp(*maybeName, loader.nameHs.data())) {
          return loader.read(*this, reader);
        }
      }
    }
  }
  return nullptr;
}


//
// Perform
//

void RulesBehavior::handlePerform(double dt) {
  auto &scene = getScene();

  // Fire create triggers. Then clear them so they're only run once on each actor.
  fireAll<CreateTrigger>();
  scene.getEntityRegistry().clear<TriggerComponent<CreateTrigger>>();

  // Run scheduled responses
  auto performTime = scene.getPerformTime();
  scene.addDebugMessage("scheduled before: {}", scheduled.size());
  scheduled.erase(std::remove_if(scheduled.begin(), scheduled.end(),
                      [&](Thread &thread) {
                        if (performTime >= thread.scheduledPerformTime) {
                          current.push_back(std::move(thread));
                          return true;
                        }
                        return false;
                      }),
      scheduled.end());
  scene.addDebugMessage("scheduled after: {}", scheduled.size());
  scene.addDebugMessage("current before: {}", current.size());
  for (auto &thread : current) {
    if (thread.response) {
      thread.response->runChain(thread.ctx);
    }
  }
  current.clear();
  scene.addDebugMessage("current before: {}", current.size());
}
