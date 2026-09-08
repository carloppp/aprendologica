package com.explorax.cazaestelar.ui;

import com.badlogic.gdx.assets.AssetManager;
import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.graphics.Texture;
import com.badlogic.gdx.files.FileHandle;
import com.badlogic.gdx.utils.Scaling;
import com.badlogic.gdx.scenes.scene2d.Stage;
import com.badlogic.gdx.scenes.scene2d.ui.Image;
import com.badlogic.gdx.scenes.scene2d.ui.Skin;
import com.badlogic.gdx.scenes.scene2d.ui.TextButton;
import com.badlogic.gdx.scenes.scene2d.utils.TextureRegionDrawable;

public final class ScreenDecor {
    private ScreenDecor() {
    }

    public static void addLoginBackground(Stage stage, AssetManager assets, Skin skin,
                                          float width, float height) {
        addBackground(stage, assets, skin, VisualAssets.LOGIN_BACKGROUND, width, height, false);
        CinematicSceneEffectsActor effects = new CinematicSceneEffectsActor(
            width, height, CinematicSceneEffectsActor.Scene.LOGIN
        );
        effects.getColor().a = 0.72f;
        stage.addActor(effects);
    }

    public static void addMenuBackground(Stage stage, AssetManager assets, Skin skin,
                                         float width, float height) {
        addBackground(stage, assets, skin, VisualAssets.MENU_BACKGROUND, width, height, false);
        CinematicSceneEffectsActor effects = new CinematicSceneEffectsActor(
            width, height, CinematicSceneEffectsActor.Scene.MENU
        );
        effects.getColor().a = 0.68f;
        stage.addActor(effects);
    }

    public static void addTelescopeBackground(Stage stage, AssetManager assets, Skin skin,
                                              float width, float height) {
        addBackground(stage, assets, skin, VisualAssets.LOGIN_BACKGROUND, width, height, false);
    }

    public static Texture addCachedBackground(Stage stage, FileHandle file, Skin skin,
                                              float width, float height) {
        Texture texture = new Texture(file);
        texture.setFilter(Texture.TextureFilter.Linear, Texture.TextureFilter.Linear);
        Image background = new Image(texture);
        background.setScaling(Scaling.fill);
        background.setBounds(0f, 0f, width, height);
        background.setTouchable(com.badlogic.gdx.scenes.scene2d.Touchable.disabled);
        stage.addActor(background);

        Image veil = new Image(new TextureRegionDrawable(
            ((TextureRegionDrawable) skin.getDrawable("white")).getRegion()
        ));
        veil.setColor(new Color(0.015f, 0.025f, 0.10f, 0.24f));
        veil.setBounds(0f, 0f, width, height);
        veil.setTouchable(com.badlogic.gdx.scenes.scene2d.Touchable.disabled);
        stage.addActor(veil);
        return texture;
    }

    private static void addBackground(Stage stage, AssetManager assets, Skin skin, String path,
                                      float width, float height, boolean animatedStars) {
        Texture texture = assets.get(path, Texture.class);
        texture.setFilter(Texture.TextureFilter.Linear, Texture.TextureFilter.Linear);
        AnimatedBackgroundActor background = new AnimatedBackgroundActor(texture, width, height);
        stage.addActor(background);

        Image veil = new Image(new TextureRegionDrawable(
            ((TextureRegionDrawable) skin.getDrawable("white")).getRegion()
        ));
        veil.setColor(new Color(0.015f, 0.025f, 0.10f, animatedStars ? 0.24f : 0.18f));
        veil.setBounds(0f, 0f, width, height);
        veil.setTouchable(com.badlogic.gdx.scenes.scene2d.Touchable.disabled);
        stage.addActor(veil);
        if (animatedStars) {
            StarFieldActor twinkles = new StarFieldActor(skin, width, height, 20);
            twinkles.getColor().a = 0.30f;
            stage.addActor(twinkles);
            ShootingStarFieldActor shootingStars = new ShootingStarFieldActor(skin, width, height);
            shootingStars.getColor().a = 0.34f;
            stage.addActor(shootingStars);
        }
    }

    public static TextureRegionDrawable drawable(AssetManager assets, String path) {
        Texture texture = assets.get(path, Texture.class);
        texture.setFilter(Texture.TextureFilter.Linear, Texture.TextureFilter.Linear);
        return new TextureRegionDrawable(texture);
    }

    public static TextButton.TextButtonStyle primaryButtonStyle(AssetManager assets, Skin skin) {
        TextButton.TextButtonStyle style = new TextButton.TextButtonStyle(
            skin.get(TextButton.TextButtonStyle.class)
        );
        style.up = drawable(assets, VisualAssets.BUTTON_PRIMARY);
        style.over = style.up;
        style.down = drawable(assets, VisualAssets.BUTTON_PRIMARY_DOWN);
        style.disabled = drawable(assets, VisualAssets.BUTTON_SECONDARY);
        return style;
    }

    public static TextButton.TextButtonStyle secondaryButtonStyle(AssetManager assets, Skin skin) {
        TextButton.TextButtonStyle style = new TextButton.TextButtonStyle(
            skin.get(TextButton.TextButtonStyle.class)
        );
        style.up = drawable(assets, VisualAssets.BUTTON_SECONDARY);
        style.over = style.up;
        style.down = drawable(assets, VisualAssets.BUTTON_PRIMARY_DOWN);
        return style;
    }
}
