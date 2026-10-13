package com.explorax.cazaestelar.ui;

import com.badlogic.gdx.assets.AssetManager;
import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.graphics.Texture;
import com.badlogic.gdx.graphics.g2d.NinePatch;
import com.badlogic.gdx.files.FileHandle;
import com.badlogic.gdx.utils.Scaling;
import com.badlogic.gdx.scenes.scene2d.Stage;
import com.badlogic.gdx.scenes.scene2d.ui.Image;
import com.badlogic.gdx.scenes.scene2d.ui.Skin;
import com.badlogic.gdx.scenes.scene2d.ui.TextButton;
import com.badlogic.gdx.scenes.scene2d.ui.TextField;
import com.badlogic.gdx.scenes.scene2d.utils.NinePatchDrawable;
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

    /** Paleta de marca de Aprendo Lógica (ver docs/PWA_MIGRATION.md). */
    public static final Color BRAND_NAVY = new Color(7f / 255f, 37f / 255f, 86f / 255f, 1f);
    public static final Color BRAND_CELESTE = new Color(140f / 255f, 205f / 255f, 253f / 255f, 1f);
    public static final Color BRAND_MUTED = new Color(84f / 255f, 104f / 255f, 140f / 255f, 1f);

    public static NinePatchDrawable ninePatch(AssetManager assets, String path,
                                              int left, int right, int top, int bottom) {
        Texture texture = assets.get(path, Texture.class);
        texture.setFilter(Texture.TextureFilter.Linear, Texture.TextureFilter.Linear);
        return new NinePatchDrawable(new NinePatch(texture, left, right, top, bottom));
    }

    /** Tarjeta clara con esquinas redondeadas y sombra (32 px de margen de sombra). */
    public static NinePatchDrawable loginCard(AssetManager assets) {
        return ninePatch(assets, VisualAssets.LOGIN_CARD, 88, 88, 88, 88);
    }

    /** Campo de texto claro: texto marino, borde celeste al enfocar. */
    public static TextField.TextFieldStyle lightFieldStyle(AssetManager assets, Skin skin) {
        TextField.TextFieldStyle style = new TextField.TextFieldStyle(skin.get(TextField.TextFieldStyle.class));
        style.background = fieldPatch(assets, VisualAssets.FIELD_LIGHT);
        style.focusedBackground = fieldPatch(assets, VisualAssets.FIELD_LIGHT_FOCUSED);
        style.fontColor = BRAND_NAVY;
        style.messageFontColor = new Color(BRAND_MUTED.r, BRAND_MUTED.g, BRAND_MUTED.b, 0.72f);
        style.cursor = skin.newDrawable("white", BRAND_NAVY);
        style.cursor.setMinWidth(3f);
        style.selection = skin.newDrawable("white", new Color(BRAND_CELESTE.r, BRAND_CELESTE.g, BRAND_CELESTE.b, 0.55f));
        return style;
    }

    private static NinePatchDrawable fieldPatch(AssetManager assets, String path) {
        NinePatchDrawable patch = ninePatch(assets, path, 36, 36, 36, 36);
        patch.setLeftWidth(30f);
        patch.setRightWidth(30f);
        return patch;
    }

    /** Botón principal amarillo de marca con relieve inferior y texto marino. */
    public static TextButton.TextButtonStyle brandButtonStyle(AssetManager assets, Skin skin) {
        TextButton.TextButtonStyle style = new TextButton.TextButtonStyle(
            skin.get(TextButton.TextButtonStyle.class)
        );
        style.up = ninePatch(assets, VisualAssets.BUTTON_BRAND, 40, 40, 40, 50);
        style.over = style.up;
        style.down = ninePatch(assets, VisualAssets.BUTTON_BRAND_DOWN, 40, 40, 40, 50);
        style.disabled = ninePatch(assets, VisualAssets.BUTTON_BRAND_DISABLED, 40, 40, 40, 50);
        style.fontColor = BRAND_NAVY;
        style.downFontColor = BRAND_NAVY;
        style.disabledFontColor = BRAND_MUTED;
        style.pressedOffsetY = -4f;
        return style;
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
