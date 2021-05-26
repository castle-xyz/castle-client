package xyz.castle;

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.ViewGroup;
import android.widget.FrameLayout;

import org.love2d.android.GameActivity;

import xyz.castle.api.SceneCreatorDownloader;

public class MainActivity extends NavigationActivity {

    private static final boolean SCENE_CREATOR_USE_PROD_SCENE_CREATOR = true;
    private static final String SCENE_CREATOR_DEV_URI = "http://192.168.1.146:8080/Client.lua";
    public static final String SCENE_CREATOR_API_VERSION = "39";

    public static GameActivity gameActivity;
    public static FrameLayout gameLayout;

    public static boolean isPopoverOpen = false;

    public static ViewGroup recreateGameLayout(Context context) {
        if (gameLayout != null) {
            gameLayout.removeView(gameActivity.getView());
        }

        gameActivity.resetNative();
        gameActivity.startNative();
        gameActivity.resume();

        gameLayout = new FrameLayout(context);
        gameLayout.addView(gameActivity.getView());

        return gameLayout;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        GameActivity.ghostRootUri = SCENE_CREATOR_USE_PROD_SCENE_CREATOR ? "" : SCENE_CREATOR_DEV_URI;
        GameActivity.sceneCreatorApiVersion = SCENE_CREATOR_API_VERSION;
        gameActivity = new GameActivity();
        gameActivity.setContexts(this, getApplicationContext());
        gameActivity.handleIntent(new Intent(this, GameActivity.class));
        GameActivity.setMetricsFromDisplay(getWindowManager().getDefaultDisplay());
        gameActivity.loadLibraries();
    }

    @Override
    protected void onResume() {
        super.onResume();

        SceneCreatorDownloader.download(this, SCENE_CREATOR_API_VERSION);
    }

    // System behavior for volume, camera, zoom buttons
    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        int keyCode = event.getKeyCode();
        if (keyCode == KeyEvent.KEYCODE_VOLUME_DOWN ||
                keyCode == KeyEvent.KEYCODE_VOLUME_UP ||
                keyCode == KeyEvent.KEYCODE_CAMERA ||
                keyCode == KeyEvent.KEYCODE_ZOOM_IN ||
                keyCode == KeyEvent.KEYCODE_ZOOM_OUT) {
            return false;
        }
        return super.dispatchKeyEvent(event);
    }

    // Called from JNI by Love's code
    public void setImmersiveMode(boolean immersive_mode) {
    }
    public boolean getImmersiveMode() {
        return false;
    }
}
