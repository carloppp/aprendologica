package com.explorax.cazaestelar.ui;

import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.graphics.Pixmap;
import com.badlogic.gdx.graphics.Texture;
import com.badlogic.gdx.graphics.g2d.BitmapFont;
import com.badlogic.gdx.graphics.g2d.freetype.FreeTypeFontGenerator;
import com.badlogic.gdx.scenes.scene2d.ui.Label;
import com.badlogic.gdx.scenes.scene2d.ui.Skin;
import com.badlogic.gdx.scenes.scene2d.ui.TextButton;
import com.badlogic.gdx.scenes.scene2d.ui.TextField;
import com.badlogic.gdx.scenes.scene2d.ui.ScrollPane;
import com.badlogic.gdx.utils.Disposable;

public final class UiResources implements Disposable {
    private final Skin skin = new Skin();

    public UiResources() {
        Pixmap pixmap = new Pixmap(1, 1, Pixmap.Format.RGBA8888);
        pixmap.setColor(Color.WHITE);
        pixmap.fill();
        skin.add("white", new Texture(pixmap));
        pixmap.dispose();
        skin.add("default-font", createFont(42, 0.8f));
        skin.add("subtitle-font", createFont(34, 0.7f));
        skin.add("title-font", createFont(76, 1.8f));

        skin.add("default", new Label.LabelStyle(skin.getFont("default-font"), Color.WHITE));
        skin.add("subtitle", new Label.LabelStyle(skin.getFont("subtitle-font"), new Color(0.75f, 0.88f, 1f, 1f)));
        skin.add("title", new Label.LabelStyle(skin.getFont("title-font"), new Color(1f, 0.86f, 0.42f, 1f)));

        TextButton.TextButtonStyle button = new TextButton.TextButtonStyle();
        button.up = skin.newDrawable("white", new Color(0.14f, 0.68f, 0.83f, 1f));
        button.down = skin.newDrawable("white", new Color(0.08f, 0.45f, 0.66f, 1f));
        button.over = skin.newDrawable("white", new Color(0.28f, 0.78f, 0.90f, 1f));
        button.disabled = skin.newDrawable("white", new Color(0.24f, 0.31f, 0.48f, 0.86f));
        button.font = skin.getFont("default-font");
        button.fontColor = Color.WHITE;
        button.disabledFontColor = new Color(0.65f, 0.70f, 0.80f, 1f);
        skin.add("default", button);

        TextButton.TextButtonStyle secondary = new TextButton.TextButtonStyle(button);
        secondary.up = skin.newDrawable("white", new Color(0.13f, 0.14f, 0.31f, 0.92f));
        secondary.down = skin.newDrawable("white", new Color(0.08f, 0.09f, 0.22f, 0.96f));
        secondary.over = skin.newDrawable("white", new Color(0.22f, 0.24f, 0.45f, 0.96f));
        skin.add("secondary", secondary);
        skin.add("default", new ScrollPane.ScrollPaneStyle());

        TextField.TextFieldStyle field = new TextField.TextFieldStyle();
        field.font = skin.getFont("default-font");
        field.fontColor = Color.WHITE;
        field.messageFont = skin.getFont("default-font");
        field.messageFontColor = new Color(0.60f, 0.68f, 0.84f, 1f);
        field.cursor = skin.newDrawable("white", new Color(0.42f, 0.88f, 1f, 1f));
        field.selection = skin.newDrawable("white", new Color(0.20f, 0.58f, 0.90f, 0.55f));
        field.background = skin.newDrawable("white", new Color(0.035f, 0.07f, 0.18f, 0.88f));
        field.focusedBackground = skin.newDrawable("white", new Color(0.055f, 0.12f, 0.27f, 0.96f));
        skin.add("default", field);
    }

    private BitmapFont createFont(int size, float borderWidth) {
        FreeTypeFontGenerator generator = new FreeTypeFontGenerator(
            com.badlogic.gdx.Gdx.files.internal("fonts/Fredoka-Variable.ttf")
        );
        FreeTypeFontGenerator.FreeTypeFontParameter parameter = new FreeTypeFontGenerator.FreeTypeFontParameter();
        parameter.size = size;
        parameter.color = Color.WHITE;
        parameter.borderWidth = borderWidth;
        parameter.borderColor = new Color(0.03f, 0.06f, 0.18f, 0.55f);
        parameter.shadowOffsetX = 1;
        parameter.shadowOffsetY = 2;
        parameter.shadowColor = new Color(0f, 0f, 0f, 0.35f);
        parameter.minFilter = Texture.TextureFilter.Linear;
        parameter.magFilter = Texture.TextureFilter.Linear;
        parameter.characters = FreeTypeFontGenerator.DEFAULT_CHARS
            + "\u00e1\u00e9\u00ed\u00f3\u00fa\u00c1\u00c9\u00cd\u00d3\u00da\u00f1\u00d1\u00a1\u00bf\u2699";
        BitmapFont font = generator.generateFont(parameter);
        generator.dispose();
        font.getData().markupEnabled = true;
        return font;
    }

    public Skin skin() {
        return skin;
    }

    @Override
    public void dispose() {
        skin.dispose();
    }
}
