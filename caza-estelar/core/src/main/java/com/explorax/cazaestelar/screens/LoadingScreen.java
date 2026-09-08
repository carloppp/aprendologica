package com.explorax.cazaestelar.screens;

import com.badlogic.gdx.assets.AssetManager;
import com.badlogic.gdx.assets.loaders.TextureLoader;
import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.graphics.Texture;
import com.badlogic.gdx.math.Interpolation;
import com.badlogic.gdx.scenes.scene2d.actions.Actions;
import com.badlogic.gdx.scenes.scene2d.ui.Container;
import com.badlogic.gdx.scenes.scene2d.ui.Image;
import com.badlogic.gdx.scenes.scene2d.ui.Label;
import com.badlogic.gdx.scenes.scene2d.ui.Table;
import com.explorax.cazaestelar.navigation.GameNavigator;
import com.explorax.cazaestelar.settings.AppSettings;
import com.explorax.cazaestelar.ui.UiResources;
import com.explorax.cazaestelar.ui.VisualAssets;

/** Cold-start introduction with the Explorax brand while assets load. */
public final class LoadingScreen extends BaseScreen {
    private static final float MINIMUM_INTRO_TIME = 2.45f;

    private final GameNavigator navigator;
    private final AssetManager assets;
    private final Image progressFill;
    private final Table intro;
    private float elapsed;
    private boolean leaving;

    public LoadingScreen(GameNavigator navigator, AssetManager assets, UiResources ui,
                         AppSettings settings) {
        this.navigator = navigator;
        this.assets = assets;

        loadLinearTexture(VisualAssets.INTRO_LOGO);
        assets.finishLoadingAsset(VisualAssets.INTRO_LOGO);
        loadLinearTexture(VisualAssets.LOGIN_BACKGROUND);
        loadLinearTexture(VisualAssets.MENU_BACKGROUND);
        loadLinearTexture(VisualAssets.GLASS_PANEL);
        loadLinearTexture(VisualAssets.BUTTON_PRIMARY);
        loadLinearTexture(VisualAssets.BUTTON_PRIMARY_DOWN);
        loadLinearTexture(VisualAssets.BUTTON_SECONDARY);

        Image backdrop = new Image(ui.skin().newDrawable(
            "white", new Color(4f / 255f, 8f / 255f, 32f / 255f, 1f)
        ));
        backdrop.setBounds(0f, 0f, WORLD_WIDTH, WORLD_HEIGHT);
        stage.addActor(backdrop);

        Image logo = new Image(assets.get(VisualAssets.INTRO_LOGO, Texture.class));
        logo.setScaling(com.badlogic.gdx.utils.Scaling.fill);
        Container<Image> logoContainer = new Container<>(logo);
        logoContainer.setBounds(0f, 0f, WORLD_WIDTH, WORLD_HEIGHT);
        logoContainer.setTransform(true);
        logoContainer.setOrigin(com.badlogic.gdx.utils.Align.center);
        logoContainer.setScale(1.075f);
        logoContainer.getColor().a = 0f;
        logoContainer.addAction(Actions.parallel(
            Actions.fadeIn(0.58f, Interpolation.fade),
            Actions.scaleTo(1f, 1f, 0.92f, Interpolation.pow2Out)
        ));
        stage.addActor(logoContainer);

        Label loading = new Label(settings.text("Cargando...", "Loading..."), ui.skin(), "subtitle");
        loading.setColor(new Color(0.63f, 0.82f, 1f, 0.88f));

        progressFill = new Image(ui.skin().newDrawable(
            "white", new Color(0.30f, 0.88f, 1f, 0.92f)
        ));
        Image progressTrack = new Image(ui.skin().newDrawable(
            "white", new Color(0.10f, 0.18f, 0.38f, 0.72f)
        ));
        Table progress = new Table();
        progress.addActor(progressTrack);
        progress.addActor(progressFill);
        progressTrack.setBounds(0f, 0f, 420f, 9f);
        progressFill.setBounds(0f, 0f, 8f, 9f);
        progress.setSize(420f, 9f);

        intro = new Table();
        intro.setFillParent(true);
        intro.bottom().padBottom(70f);
        intro.add(loading).padBottom(20f).row();
        intro.add(progress).size(420f, 9f);
        stage.addActor(intro);
    }

    private void loadLinearTexture(String path) {
        TextureLoader.TextureParameter parameter = new TextureLoader.TextureParameter();
        parameter.minFilter = Texture.TextureFilter.Linear;
        parameter.magFilter = Texture.TextureFilter.Linear;
        parameter.genMipMaps = false;
        assets.load(path, Texture.class, parameter);
    }

    @Override
    public void render(float delta) {
        elapsed += delta;
        boolean ready = assets.update();
        progressFill.setWidth(Math.max(8f, 420f * assets.getProgress()));
        super.render(delta);

        if (!leaving && ready && elapsed >= MINIMUM_INTRO_TIME) {
            leaving = true;
            stage.getRoot().clearActions();
            stage.getRoot().addAction(Actions.sequence(
                Actions.delay(0.18f),
                Actions.parallel(
                    Actions.fadeOut(0.62f, Interpolation.fade),
                    Actions.scaleTo(1.035f, 1.035f, 0.62f, Interpolation.pow2In)
                ),
                Actions.run(navigator::showEntry)
            ));
        }
    }
}
