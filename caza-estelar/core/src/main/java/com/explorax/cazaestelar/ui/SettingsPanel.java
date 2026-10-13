package com.explorax.cazaestelar.ui;

import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.math.Interpolation;
import com.badlogic.gdx.scenes.scene2d.Group;
import com.badlogic.gdx.scenes.scene2d.InputEvent;
import com.badlogic.gdx.scenes.scene2d.Stage;
import com.badlogic.gdx.scenes.scene2d.Touchable;
import com.badlogic.gdx.scenes.scene2d.actions.Actions;
import com.badlogic.gdx.scenes.scene2d.ui.Image;
import com.badlogic.gdx.scenes.scene2d.ui.Label;
import com.badlogic.gdx.scenes.scene2d.ui.Skin;
import com.badlogic.gdx.scenes.scene2d.ui.Table;
import com.badlogic.gdx.scenes.scene2d.ui.TextButton;
import com.badlogic.gdx.scenes.scene2d.utils.ClickListener;
import com.badlogic.gdx.utils.Scaling;
import com.explorax.cazaestelar.settings.AppSettings;

/** Collapsible top-left settings control shared by interactive screens. */
public final class SettingsPanel extends Group {
    private final AppSettings settings;
    private final Runnable onLanguageChanged;
    private final Runnable onSignOut;
    private final Skin skin;
    private final Table panel = new Table();
    private final float panelHeight;
    private boolean expanded;

    public SettingsPanel(AppSettings settings, Skin skin, float worldHeight,
                         Runnable onLanguageChanged, Runnable onSignOut) {
        this.settings = settings;
        this.skin = skin;
        this.onLanguageChanged = onLanguageChanged;
        this.onSignOut = onSignOut;
        panelHeight = onSignOut == null ? 315f : 400f;
        setBounds(24f, worldHeight - panelHeight - 115f, 470f, panelHeight + 90f);
        setTouchable(Touchable.childrenOnly);

        panel.setBounds(0f, 0f, 455f, panelHeight);
        panel.setBackground(skin.newDrawable("white", new Color(0.025f, 0.09f, 0.24f, 0.96f)));
        panel.pad(28f);
        panel.setTransform(true);
        panel.setOrigin(30f, panelHeight);
        panel.setVisible(false);
        addActor(panel);

        // \u00cdcono dibujado en UiResources: Fredoka no incluye el glifo de engranaje.
        TextButton toggle = new TextButton("", blueButtonStyle());
        toggle.clearChildren();
        Image gear = new Image(skin.getDrawable(UiResources.SETTINGS_ICON));
        gear.setScaling(Scaling.fit);
        toggle.add(gear).size(50f);
        toggle.setBounds(0f, panelHeight + 10f, 92f, 80f);
        toggle.addListener(new ClickListener() {
            @Override public void clicked(InputEvent event, float x, float y) {
                setExpanded(!expanded);
            }
        });
        addActor(toggle);
        rebuildPanel();
    }

    private void rebuildPanel() {
        panel.clearChildren();
        Label title = new Label(settings.text("Ajustes", "Settings"), skin, "subtitle");
        TextButton spanish = new TextButton("Espa\u00f1ol", blueButtonStyle());
        TextButton english = new TextButton("English", blueButtonStyle());
        TextButton sound = new TextButton(soundText(), blueButtonStyle());

        spanish.setDisabled(settings.language() == AppSettings.Language.SPANISH);
        english.setDisabled(settings.language() == AppSettings.Language.ENGLISH);
        spanish.addListener(languageListener(AppSettings.Language.SPANISH));
        english.addListener(languageListener(AppSettings.Language.ENGLISH));
        sound.addListener(new ClickListener() {
            @Override public void clicked(InputEvent event, float x, float y) {
                settings.toggleSound();
                sound.setText(soundText());
            }
        });

        panel.add(title).colspan(2).padBottom(22f).row();
        panel.add(spanish).width(185f).height(68f).padRight(12f);
        panel.add(english).width(185f).height(68f).row();
        panel.add(sound).colspan(2).width(382f).height(68f).padTop(18f);
        if (onSignOut != null) {
            panel.row();
            TextButton signOut = new TextButton(
                settings.text("Cerrar sesi\u00f3n", "Sign out"), blueButtonStyle()
            );
            signOut.addListener(new ClickListener() {
                @Override public void clicked(InputEvent event, float x, float y) {
                    setExpanded(false);
                    onSignOut.run();
                }
            });
            panel.add(signOut).colspan(2).width(382f).height(68f).padTop(16f);
        }
    }

    private ClickListener languageListener(AppSettings.Language language) {
        return new ClickListener() {
            @Override public void clicked(InputEvent event, float x, float y) {
                if (settings.language() == language) return;
                settings.setLanguage(language);
                setExpanded(false);
                onLanguageChanged.run();
            }
        };
    }

    private String soundText() {
        if (settings.soundEnabled()) return settings.text("Sonido: activado", "Sound: on");
        return settings.text("Sonido: desactivado", "Sound: off");
    }

    private TextButton.TextButtonStyle blueButtonStyle() {
        TextButton.TextButtonStyle style = new TextButton.TextButtonStyle(
            skin.get(TextButton.TextButtonStyle.class)
        );
        style.up = skin.newDrawable("white", new Color(0.08f, 0.37f, 0.67f, 0.98f));
        style.over = skin.newDrawable("white", new Color(0.10f, 0.53f, 0.82f, 1f));
        style.down = skin.newDrawable("white", new Color(0.045f, 0.23f, 0.50f, 1f));
        style.disabled = skin.newDrawable("white", new Color(0.08f, 0.24f, 0.43f, 0.92f));
        style.disabledFontColor = new Color(0.65f, 0.82f, 1f, 0.78f);
        return style;
    }

    private void setExpanded(boolean expand) {
        expanded = expand;
        panel.clearActions();
        if (expand) {
            panel.setVisible(true);
            panel.getColor().a = 0f;
            panel.setScale(0.72f);
            panel.addAction(Actions.parallel(
                Actions.fadeIn(0.20f, Interpolation.fade),
                Actions.scaleTo(1f, 1f, 0.24f, Interpolation.swingOut)
            ));
        } else {
            panel.addAction(Actions.sequence(
                Actions.parallel(
                    Actions.fadeOut(0.16f, Interpolation.fade),
                    Actions.scaleTo(0.72f, 0.72f, 0.16f, Interpolation.pow2In)
                ),
                Actions.visible(false)
            ));
        }
    }

    public static void addTo(Stage stage, AppSettings settings, Skin skin,
                             float worldHeight, Runnable onLanguageChanged) {
        stage.addActor(new SettingsPanel(
            settings, skin, worldHeight, onLanguageChanged, null
        ));
    }

    public static void addTo(Stage stage, AppSettings settings, Skin skin,
                             float worldHeight, Runnable onLanguageChanged,
                             Runnable onSignOut) {
        stage.addActor(new SettingsPanel(
            settings, skin, worldHeight, onLanguageChanged, onSignOut
        ));
    }
}
