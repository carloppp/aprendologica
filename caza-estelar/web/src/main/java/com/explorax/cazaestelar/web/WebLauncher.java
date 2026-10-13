package com.explorax.cazaestelar.web;

import com.github.xpenatan.gdx.teavm.backends.web.WebApplication;
import com.github.xpenatan.gdx.teavm.backends.web.WebApplicationConfiguration;
import com.explorax.cazaestelar.CazaEstelarGame;

public final class WebLauncher {
    private WebLauncher() {
    }

    public static void main(String[] args) {
        WebApplicationConfiguration config = new WebApplicationConfiguration();
        config.width = 0;
        config.height = 0;
        config.useGL30 = false;
        // UiResources genera las fuentes con FreeType; en web su módulo WASM debe cargarse antes de create().
        config.preloadListener = assetLoader -> assetLoader.loadScript("freetype.js");
        new WebApplication(new CazaEstelarGame(), config);
    }
}
