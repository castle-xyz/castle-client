package ghost;

import android.app.Activity;
import android.content.Intent;
import android.view.ViewGroup;

import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

import org.love2d.android.GameActivity;

import javax.annotation.Nullable;

public class GhostViewManager extends SimpleViewManager<ViewGroup> implements LifecycleEventListener {
  private GameActivity gameActivity;

  GhostViewManager(ReactApplicationContext reactContext) {
    reactContext.addLifecycleEventListener(this);
  }

  @Override
  public String getName() {
    return "GhostView";
  }

  @Override
  protected ViewGroup createViewInstance(ThemedReactContext reactContext) {
    ensureGameActivityInitialized(reactContext);
    gameActivity.resetNative();
    gameActivity.startNative();
    gameActivity.resume();
    return gameActivity.getView();
  }

  private void ensureGameActivityInitialized(ThemedReactContext reactContext) {
    if (gameActivity == null) {
      Activity activity = reactContext.getCurrentActivity();
      gameActivity = new GameActivity();
      gameActivity.setContexts(activity, reactContext.getApplicationContext());
      gameActivity.handleIntent(new Intent(activity, GameActivity.class));
      GameActivity.setMetricsFromDisplay(activity.getWindowManager().getDefaultDisplay());
      gameActivity.loadLibraries();
    }
  }

  @ReactProp(name = "uri")
  public void setUri(ViewGroup view, @Nullable String uri) {
    GameActivity.ghostRootUri = uri;
  }

  @ReactProp(name = "screenScaling")
  public void setScreenScaling(ViewGroup view, double screenScaling) {
    GameActivity.ghostScreenScaling = screenScaling;
  }

  @ReactProp(name = "applyScreenScaling")
  public void setScreenScaling(ViewGroup view, boolean applyScreenScaling) {
    GameActivity.ghostApplyScreenScaling = applyScreenScaling;
  }

  @Override
  public void onHostPause() {
    if (gameActivity != null && gameActivity.isRunning()) {
      gameActivity.onWindowFocusChanged(false);
      gameActivity.pause();
    }
  }

  @Override
  public void onHostResume() {
    if (gameActivity != null && gameActivity.isRunning()) {
      gameActivity.resume();
      gameActivity.onWindowFocusChanged(true);
    }
  }

  @Override
  public void onHostDestroy() {

  }
}
