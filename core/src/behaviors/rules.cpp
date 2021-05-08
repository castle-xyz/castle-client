#include "rules.h"

#include "behaviors/all.h"


//
// Lifecycle triggers
//

struct CreateTrigger : BaseTrigger {
  inline static const RuleRegistration<CreateTrigger, RulesBehavior> registration { "create" };

  struct Params {
  } params;
};

struct DestroyTrigger : BaseTrigger {
  inline static const RuleRegistration<DestroyTrigger, RulesBehavior> registration { "destroy" };

  struct Params {
  } params;
};


//
// Lifecycle responses
//

struct CreateResponse : BaseResponse {
  inline static const RuleRegistration<CreateResponse, RulesBehavior> registration { "create" };

  struct Params {
    PROP(std::string, entryId);
    PROP(std::string, coordinateSystem) = "relative position";
    PROP(ExpressionRef, xOffset) = 0;
    PROP(ExpressionRef, yOffset) = 0;
    PROP(ExpressionRef, xAbsolute) = 0;
    PROP(ExpressionRef, yAbsolute) = 0;
    PROP(ExpressionRef, angle) = 0;
    PROP(ExpressionRef, distance) = 0;
    PROP(std::string, depth) = "in front of all actors";
  } params;

  void run(RuleContext &ctx) override {
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
      b2Vec2 newPos;
      auto &coordinateSystem = params.coordinateSystem();
      if (coordinateSystem[0] == 'r') { // Whether starts with "relative" or "absolute"
        // Relative
        auto creatorPos = b2Vec2(0, 0);
        float creatorAngle = 0;
        if (auto creatorBody = bodyBehavior.maybeGetPhysicsBody(ctx.actorId)) {
          // TODO(nikki): Use old position, angle if creator actor was destroyed
          creatorPos = creatorBody->GetPosition();
          creatorAngle = creatorBody->GetAngle();
        }
        if (coordinateSystem[9] == 'p') { // Whether has "position" or "angle" in the middle
          // Relative position
          auto xOffset = params.xOffset().eval<float>(ctx);
          auto yOffset = params.yOffset().eval<float>(ctx);
          newPos = creatorPos + b2Vec2(xOffset, yOffset);
        } else {
          // Relative angle and distance
          auto angle = params.angle().eval<float>(ctx) + creatorAngle;
          auto distance = params.distance().eval<float>(ctx);
          newPos = creatorPos + distance * b2Vec2(std::cos(angle), std::sin(angle));
        }
      } else {
        // Absolute
        auto xAbsolute = params.xAbsolute().eval<float>(ctx);
        auto yAbsolute = params.yAbsolute().eval<float>(ctx);
        newPos = { xAbsolute, yAbsolute };
      }
      newBody->SetTransform(newPos, newBody->GetAngle());
    }
  }
};

struct DestroyResponseMarker {
  // Added to an actor when a destroy response is run on it, marking an impending destruction. The
  // actor is destroyed at the end of the frame rather than right away, so that rule execution can
  // continue.
};

struct DestroyResponse : BaseResponse {
  inline static const RuleRegistration<DestroyResponse, RulesBehavior> registration { "destroy" };

  struct Params {
  } params;

  void run(RuleContext &ctx) override {
    auto &scene = ctx.getScene();
    auto actorId = ctx.actorId;
    if (scene.hasActor(actorId)) {
      scene.getEntityRegistry().emplace_or_replace<DestroyResponseMarker>(actorId);
    }
  }
};


//
// Behavior responses
//

struct EnableBehaviorResponse : BaseResponse {
  inline static const RuleRegistration<EnableBehaviorResponse, RulesBehavior> registration {
    "enable behavior"
  };

  struct Params {
    PROP(int, behaviorId) = -1;
  } params;

  void run(RuleContext &ctx) override {
    ctx.getScene().getBehaviors().byId(params.behaviorId(), [&](auto &behavior) {
      behavior.enableComponent(ctx.actorId);
    });
  }
};

struct DisableBehaviorResponse : BaseResponse {
  inline static const RuleRegistration<DisableBehaviorResponse, RulesBehavior> registration {
    "disable behavior"
  };

  struct Params {
    PROP(int, behaviorId) = -1;
  } params;

  void run(RuleContext &ctx) override {
    ctx.getScene().getBehaviors().byId(params.behaviorId(), [&](auto &behavior) {
      behavior.disableComponent(ctx.actorId);
    });
  }
};

struct SetBehaviorPropertyResponse : BaseResponse {
  inline static const RuleRegistration<SetBehaviorPropertyResponse, RulesBehavior> registration {
    "set behavior property"
  };

  struct Params {
    PROP(int, behaviorId) = -1;
    PROP(PropId, propertyName);
    PROP(ExpressionRef, value);
    PROP(bool, relative) = false;
  } params;

  // Cache the call to `.setProperty` so we don't have to do the lookup by `behaviorId` every time
  // this response is run

  void (*cache)(RuleContext &, ActorId, PropId, const ExpressionValue &, bool) = nullptr;

  void run(RuleContext &ctx) override {
    if (!cache) {
      ctx.getScene().getBehaviors().byId(params.behaviorId(), [&](auto &behavior) {
        using Behavior = std::remove_reference_t<decltype(behavior)>;
        cache = [](RuleContext &ctx, ActorId actorId, PropId propId, const ExpressionValue &value,
                    bool relative) {
          auto &behavior = ctx.getScene().getBehaviors().byType<Behavior>();
          behavior.setProperty(actorId, propId, value, relative);
        };
      });
    }
    if (cache) {
      cache(ctx, ctx.actorId, params.propertyName(), params.value().eval(ctx), params.relative());
    }
  }
};


//
// Control flow responses
//

struct IfResponse : BaseResponse {
  inline static const RuleRegistration<IfResponse, RulesBehavior> registration { "if" };

  struct Params {
    PROP(ResponseRef, condition) = nullptr;
    PROP(ResponseRef, then) = nullptr;
    PROP_NAMED("else", ResponseRef, else_) = nullptr;
  } params;

  void linearize(ResponseRef continuation) override {
    // Set `next` as the continuation after either branch. This ensures nested 'wait's in either
    // branch block outer responses, and also defaults either branch to `next` if empty.
    BaseResponse::linearize(next, continuation);
    BaseResponse::linearize(params.then(), next);
    BaseResponse::linearize(params.else_(), next);
  }

  void run(RuleContext &ctx) override {
    // Default to 'then' branch on non-existent condition
    if (auto condition = params.condition(); !condition || condition->eval(ctx)) {
      ctx.setNext(params.then());
    } else {
      ctx.setNext(params.else_());
    }
  }
};

struct RepeatResponse : BaseResponse {
  inline static const RuleRegistration<RepeatResponse, RulesBehavior> registration { "repeat" };

  struct Params {
    PROP(ExpressionRef, count) = 3;
    PROP(ResponseRef, body) = nullptr;
  } params;

  void linearize(ResponseRef continuation) override {
    // Set ourselves as the continuation after the body. This way execution will loop back around to
    // us after the body, even if there are nested 'wait's in it.
    BaseResponse::linearize(next, continuation);
    BaseResponse::linearize(params.body(), this);
  }

  void run(RuleContext &ctx) override {
    // Check if we're in progress (are at the top of the repeat stack)
    if (ctx.repeatStack.size() > 0) {
      if (auto &top = ctx.repeatStack.back(); top.response == this) {
        // Check that we have repetitions left and also that the current actor exists
        if (top.count > 0 && ctx.getScene().hasActor(ctx.actorId)) {
          // Continue -- decrement count and enter body
          --top.count;
          ctx.setNext(params.body());
        } else {
          // Stop -- pop ourselves off repeat stack and continue with `next` normally
          ctx.repeatStack.pop_back();
        }
        return;
      }
    }

    // Not in progress -- add ourselves to repeat stack
    if (auto count = params.count().eval<int>(ctx); count > 0) {
      // We're about to do one repetition right away, so save `count - 1` to the stack
      ctx.repeatStack.push_back({ this, count - 1 });
      ctx.setNext(params.body());
    }
  }
};

struct InfiniteRepeatResponse : BaseResponse {
  inline static const RuleRegistration<InfiniteRepeatResponse, RulesBehavior> registration {
    "infinite repeat"
  };

  struct Params {
    PROP(double, interval) = 1;
    PROP(ResponseRef, body) = nullptr;
  } params;

  void linearize(ResponseRef continuation) override {
    // Set ourselves as the continuation after the body. This way execution will loop back around to
    // us after the body, even if there are nested 'wait's in it.
    BaseResponse::linearize(next, continuation);
    BaseResponse::linearize(params.body(), this);
  }

  void run(RuleContext &ctx) override {
    if (ctx.repeatStack.size() > 0 && ctx.repeatStack.back().response == this) {
      // Got back here after body -- check that we're not stopped and that the current actor exists
      if (ctx.repeatStack.back().count != 0 && ctx.getScene().hasActor(ctx.actorId)) {
        // Continue -- schedule `body` to after the interval, or the next frame if the interval is
        // close enough to 60Hz
        ctx.setNext(params.body());
        auto &scene = ctx.getScene();
        auto &rulesBehavior = scene.getBehaviors().byType<RulesBehavior>();
        auto interval = params.interval();
        auto performTime = interval < 0.02 ? 0 : scene.getPerformTime() + interval;
        rulesBehavior.schedule(ctx.suspend(), performTime);
      } else {
        // Stop -- remove ourselves from the repeat stack and continue with `next` normally
        ctx.repeatStack.pop_back();
      }
    } else {
      // Haven't started yet -- add ourselves to the repeat stack and do one repetition right away
      ctx.repeatStack.push_back({ this, 1 }); // Just use `1` -- we continue for anything `!= 0`
      ctx.setNext(params.body());
    }
  }
};

struct StopRepeatingResponse : BaseResponse {
  inline static const RuleRegistration<StopRepeatingResponse, RulesBehavior> registration {
    "stop repeating"
  };

  struct Params {
  } params;

  void run(RuleContext &ctx) override {
    if (ctx.repeatStack.size() > 0) {
      ctx.repeatStack.back().count = 0; // Cancels `RepeatResponse` and `InfiniteRepeatResponse`
    }
  }
};

struct ActOnResponse : BaseResponse {
  inline static const RuleRegistration<ActOnResponse, RulesBehavior> registration { "act on" };

  struct Params {
    PROP(Tag, tag);
    PROP(ResponseRef, body) = nullptr;
  } params;

  void linearize(ResponseRef continuation) override {
    // Same as `RepeatResponse::linearize`
    BaseResponse::linearize(next, continuation);
    BaseResponse::linearize(params.body(), this);
  }

  void run(RuleContext &ctx) override {
    auto &tagsBehavior = ctx.getScene().getBehaviors().byType<TagsBehavior>();
    auto &actorIds = tagsBehavior.getActors(params.tag());

    // Check if we're in progress (are at the top of the act-on stack)
    if (ctx.actOnStack.size() > 0) {
      if (auto &top = ctx.actOnStack.back(); top.response == this) {
        if (top.index < int(actorIds.size())) {
          // Still have actors left to visit -- set to visit next actor, increment index, enter body
          ctx.actorId = actorIds.data()[top.index];
          ++top.index;
          ctx.setNext(params.body());
        } else {
          // No actors left -- return to original actor, pop off stack, continue with `next`
          ctx.actorId = top.returnActorId;
          ctx.actOnStack.pop_back();
        }
        return;
      }
    }

    // Not in progress -- add ourselves to the act-on stack and start visiting actors
    if (!actorIds.empty()) {
      ctx.actOnStack.push_back({ this, 1, ctx.actorId }); // Visiting index 0 right away, 1 is next
      ctx.actorId = actorIds.data()[0];
      ctx.setNext(params.body());
    }
  }
};

struct ActOnOtherResponse : BaseResponse {
  inline static const RuleRegistration<ActOnOtherResponse, RulesBehavior> registration {
    "act on other"
  };

  struct Params {
    PROP(ResponseRef, body) = nullptr;
  } params;

  void linearize(ResponseRef continuation) override {
    // Same as `RepeatResponse::linearize`
    BaseResponse::linearize(next, continuation);
    BaseResponse::linearize(params.body(), this);
  }

  void run(RuleContext &ctx) override {
    // Check if we're in progress (are at the top of the act-on stack)
    if (ctx.actOnStack.size() > 0) {
      if (auto &top = ctx.actOnStack.back(); top.response == this) {
        // Return to original actor, pop off stack, continue with `next`
        ctx.actorId = top.returnActorId;
        ctx.actOnStack.pop_back();
        return;
      }
    }

    // Not in progress -- if `otherActorId` exists, add ourselves to the act-on stack and visit it
    if (auto otherActorId = ctx.extras.otherActorId; ctx.getScene().hasActor(otherActorId)) {
      ctx.actOnStack.push_back({ this, 1, ctx.actorId }); // We don't really use `index`
      ctx.actorId = otherActorId;
      ctx.setNext(params.body());
    }
  }
};


//
// Timing responses
//

struct WaitResponse : BaseResponse {
  inline static const RuleRegistration<WaitResponse, RulesBehavior> registration { "wait" };

  struct Params {
    PROP(ExpressionRef, duration) = 1;
  } params;

  void run(RuleContext &ctx) override {
    if (next) {
      auto &scene = ctx.getScene();
      auto &rulesBehavior = scene.getBehaviors().byType<RulesBehavior>();
      auto duration = params.duration().eval<double>(ctx);
      rulesBehavior.schedule(ctx.suspend(), scene.getPerformTime() + duration);
    }
  }
};


//
// Expressions responses
//

struct ExpressionMeetsConditionResponse : BaseResponse {
  inline static const RuleRegistration<ExpressionMeetsConditionResponse, RulesBehavior>
      registration { "expression meets condition" };

  struct Params {
    PROP(ExpressionRef, lhs) = 0;
    PROP(std::string, comparison) = "equal";
    PROP(ExpressionRef, rhs) = 0;
  } params;

  bool eval(RuleContext &ctx) override {
    return params.lhs().eval(ctx).compare(params.comparison(), params.rhs().eval(ctx));
  }
};


//
// Random responses
//

struct CoinFlipResponse : BaseResponse {
  inline static const RuleRegistration<CoinFlipResponse, RulesBehavior> registration {
    "coin flip"
  };

  struct Params {
    PROP(ExpressionRef, probability) = 0.5;
  } params;

  bool eval(RuleContext &ctx) override {
    auto probability = params.probability().eval<double>(ctx);
    return ctx.getScene().getRNG().random() < probability;
  }
};


//
// Sound responses
//

struct PlaySoundResponse : BaseResponse {
  inline static const RuleRegistration<PlaySoundResponse, RulesBehavior> registration {
    "play sound"
  };

  struct Params {
    PROP(std::string, category);
    PROP(int, seed);
    PROP(int, mutationSeed) = 0;
    PROP(int, mutationAmount) = 5;
  } params;

  void run(RuleContext &ctx) override {
    auto &sound = ctx.getScene().getSound();
    sound.play(params.category(), params.seed(), params.mutationSeed(), params.mutationAmount());
  }
};


//
// Meta responses
//

#define DEBUG_LOG_NOTE_RESPONSE // Uncomment to log note messages

struct NoteResponse : BaseResponse {
  inline static const RuleRegistration<NoteResponse, RulesBehavior> registration { "note" };

  struct Params {
#ifdef DEBUG_LOG_NOTE_RESPONSE
    PROP(std::string, note); // Only needed if we're going to log notes, skip overhead otherwise
#endif
  } params;

  void run(RuleContext &ctx) override {
#ifdef DEBUG_LOG_NOTE_RESPONSE
    Debug::log("actor {} note: {}", ctx.actorId, params.note());
#endif
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
  fire<DestroyTrigger>(actorId, {});
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
        if (response) {
          // This is a root, so linearize from here
          response->linearize(nullptr);
        }
        responseCache.insert_or_assign(jsonPtr, response);
      }
    });
    if (!response) {
      return; // Failed to load response
    }

    // Trigger
    reader.obj("trigger", [&]() {
      // Find loader by name and behavior id
      if (auto name = reader.str("name")) {
        if (auto behaviorId = reader.num("behaviorId")) {
          auto nameHash = entt::hashed_string(*name).value();
          for (auto &loader : triggerLoaders) {
            if (loader.behaviorId == *behaviorId && nameHash == loader.nameHs.value()
                && !std::strcmp(*name, loader.nameHs.data())) {
              loader.read(getScene(), actorId, response, reader);
              return;
            }
          }
        }
        Debug::log("RulesBehavior: unsupported trigger type '{}'", *name);
      }
    });
  });
}

ResponseRef RulesBehavior::readResponse(Reader &reader) {
  // Find loader by name and behavior id
  if (auto name = reader.str("name")) {
    if (auto behaviorId = reader.num("behaviorId")) {
      auto nameHash = entt::hashed_string(*name).value();
      for (auto &loader : responseLoaders) {
        if (loader.behaviorId == *behaviorId && nameHash == loader.nameHs.value()
            && !std::strcmp(*name, loader.nameHs.data())) {
          return loader.read(*this, reader);
        }
      }
    }
    Debug::log("RulesBehavior: unsupported response type '{}'", *name);
  }
  return nullptr;
}

void RulesBehavior::readExpression(ExpressionRef &expr, Reader &reader) {
  if (auto value = reader.num()) {
    // Plain number value
    expr.constant = *value;
  } else {
    // Nested expression -- find loader by type
    if (auto name = reader.str("expressionType")) {
      auto nameHash = entt::hashed_string(*name).value();
      for (auto &loader : expressionLoaders) {
        if (nameHash == loader.nameHs.value() && !std::strcmp(*name, loader.nameHs.data())) {
          loader.read(expr, *this, reader);
          return;
        }
      }
      Debug::log("RulesBehavior: unsupported expression type '{}'", *name);
    }
  }
}


//
// Perform
//

void RuleContext::run() {
  auto curr = next;
  while (curr) {
    next = curr->next; // Default to the response's `next`. It'll have an opportunity to override
                       // this in its `run()`.
    curr->run(*this);
    curr = next;
  }
}

void RulesBehavior::handlePerform(double dt) {
  auto &scene = getScene();
  auto &registry = scene.getEntityRegistry();

  // Fire create triggers. Then clear them so they're only run once on each actor.
  fireAllEnabled<CreateTrigger>({});
  registry.clear<TriggerComponent<CreateTrigger>>();

  // Run contexts. Move ready contexts from `scheduleds` to `current`, then run and clear `current`.
  // We don't run contexts directly from `scheduleds` because they could schedule new contexts when
  // run, which would modify `scheduleds` and invalidate the iteration.
  auto performTime = scene.getPerformTime();
  Debug::display("scheduled: {}", scheduleds.size());
  scheduleds.erase(std::remove_if(scheduleds.begin(), scheduleds.end(),
                       [&](Scheduled &scheduled) {
                         if (performTime >= scheduled.performTime) {
                           current.push_back(std::move(scheduled.ctx));
                           return true;
                         }
                         return false;
                       }),
      scheduleds.end());
  Debug::display("current: {}", current.size());
  for (auto &ctx : current) {
    ctx.run();
  }
  current.clear();

  // Actually remove actors marked by `DestroyResponse`.
  registry.view<DestroyResponseMarker>().each([&](ActorId actorId) {
    // Destroying the current entity while iterating is safe according to:
    // https://github.com/skypjack/entt/wiki/Crash-Course:-entity-component-system#what-is-allowed-and-what-is-not
    scene.removeActor(actorId);
  });
}
