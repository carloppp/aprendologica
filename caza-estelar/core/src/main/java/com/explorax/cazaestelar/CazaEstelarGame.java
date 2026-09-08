package com.explorax.cazaestelar;

import com.badlogic.gdx.Game;
import com.badlogic.gdx.assets.AssetManager;
import com.explorax.cazaestelar.navigation.GameNavigator;
import com.explorax.cazaestelar.content.ContentService;
import com.explorax.cazaestelar.content.ContentServices;
import com.explorax.cazaestelar.mechanics.MechanicRegistry;
import com.explorax.cazaestelar.progress.GdxPreferencesProgressRepository;
import com.explorax.cazaestelar.progress.ProgressRepository;
import com.explorax.cazaestelar.progress.sync.ProgressServices;
import com.explorax.cazaestelar.media.MediaServices;
import com.explorax.cazaestelar.media.RemoteMediaManager;
import com.explorax.cazaestelar.session.AuthTokenStore;
import com.explorax.cazaestelar.session.InMemoryAuthTokenStore;
import com.explorax.cazaestelar.session.AuthenticationService;
import com.explorax.cazaestelar.session.AuthenticationServices;
import com.explorax.cazaestelar.settings.AppSettings;
import com.explorax.cazaestelar.ui.CinematicSceneEffectsActor;
import com.explorax.cazaestelar.ui.UiResources;
import com.explorax.cazaestelar.diagnostics.AppDiagnostics;
import com.explorax.cazaestelar.diagnostics.GdxAppDiagnostics;
import com.explorax.cazaestelar.network.config.NetworkConfigurationPolicy;
import com.explorax.cazaestelar.network.config.NetworkServicesConfig;
import com.explorax.cazaestelar.network.config.NetworkServicesConfigParser;

public final class CazaEstelarGame extends Game {
    private final AuthTokenStore tokenStore;
    private AssetManager assets;
    private UiResources ui;
    private GameNavigator navigator;
    private final AppDiagnostics diagnostics = new GdxAppDiagnostics();
    private boolean handlingRenderFailure;

    public CazaEstelarGame() {
        this(new InMemoryAuthTokenStore());
    }

    public CazaEstelarGame(AuthTokenStore tokenStore) {
        this.tokenStore = tokenStore;
    }

    @Override
    public void create() {
        assets = new AssetManager();
        ui = new UiResources();
        MechanicRegistry mechanics = MechanicRegistry.defaultRegistry();
        ContentService content = ContentServices.createDefault(
            "content/catalog.json", "content/source.json", mechanics.supportedTypes()
        );
        RemoteMediaManager media = MediaServices.createDefault();
        NetworkServicesConfig network = NetworkServicesConfigParser.loadInternal(
            "network/services.json"
        );
        if (!NetworkConfigurationPolicy.validate(network).isEmpty()) {
            diagnostics.error("network_configuration_invalid");
        } else if (network.getDevelopmentMode()) {
            diagnostics.warning("development_mode_enabled");
        }
        AuthenticationService authentication = AuthenticationServices.create(network, tokenStore);
        ProgressRepository progress = ProgressServices.create(
            network, GdxPreferencesProgressRepository.createDefault(), tokenStore
        );
        navigator = new GameNavigator(
            this, assets, ui, authentication, new AppSettings(),
            content, mechanics,
            progress, media, diagnostics
        );
        navigator.showLoading();
    }

    @Override
    public void render() {
        try {
            super.render();
            handlingRenderFailure = false;
        } catch (RuntimeException error) {
            if (handlingRenderFailure) return;
            handlingRenderFailure = true;
            diagnostics.error("uncaught_render_failure");
            if (navigator != null) navigator.showRecovery();
        }
    }

    @Override
    public void dispose() {
        super.dispose();
        CinematicSceneEffectsActor.disposeSharedResources();
        if (ui != null) ui.dispose();
        if (assets != null) assets.dispose();
    }
}
