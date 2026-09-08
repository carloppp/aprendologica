package com.explorax.cazaestelar.diagnostics;

import com.badlogic.gdx.Gdx;

public final class GdxAppDiagnostics implements AppDiagnostics {
    private static final String TAG = "CazaEstelar";

    @Override public void info(String eventCode) {
        Gdx.app.log(TAG, eventCode);
    }

    @Override public void warning(String eventCode) {
        Gdx.app.log(TAG, "warning:" + eventCode);
    }

    @Override public void error(String eventCode) {
        Gdx.app.error(TAG, eventCode);
    }
}
