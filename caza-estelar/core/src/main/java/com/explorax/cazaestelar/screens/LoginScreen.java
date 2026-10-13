package com.explorax.cazaestelar.screens;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.assets.AssetManager;
import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.graphics.Texture;
import com.badlogic.gdx.math.Interpolation;
import com.badlogic.gdx.scenes.scene2d.InputEvent;
import com.badlogic.gdx.scenes.scene2d.actions.Actions;
import com.badlogic.gdx.scenes.scene2d.ui.Image;
import com.badlogic.gdx.scenes.scene2d.ui.Label;
import com.badlogic.gdx.scenes.scene2d.ui.Table;
import com.badlogic.gdx.scenes.scene2d.ui.TextButton;
import com.badlogic.gdx.scenes.scene2d.ui.TextField;
import com.badlogic.gdx.scenes.scene2d.utils.ClickListener;
import com.badlogic.gdx.utils.Align;
import com.badlogic.gdx.utils.Scaling;
import com.explorax.cazaestelar.navigation.GameNavigator;
import com.explorax.cazaestelar.session.PlayerSession;
import com.explorax.cazaestelar.settings.AppSettings;
import com.explorax.cazaestelar.ui.ScreenDecor;
import com.explorax.cazaestelar.ui.SettingsPanel;
import com.explorax.cazaestelar.ui.StarTravelActor;
import com.explorax.cazaestelar.ui.UiResources;
import com.explorax.cazaestelar.ui.VisualAssets;

public final class LoginScreen extends BaseScreen {
    private static final float FIELD_WIDTH = 498f;

    public LoginScreen(GameNavigator navigator, UiResources ui, AssetManager assets,
                       AppSettings settings) {
        ScreenDecor.addLoginBackground(stage, assets, ui.skin(), WORLD_WIDTH, WORLD_HEIGHT);

        Table panel = new Table();
        panel.setBounds(1150f, 70f, 690f, 940f);
        panel.setBackground(ScreenDecor.loginCard(assets));
        // 32 px de la tarjeta son sombra; el resto es margen interior.
        panel.pad(84f, 96f, 104f, 96f);
        panel.getColor().a = 0f;
        panel.moveBy(55f, 0f);
        panel.addAction(Actions.sequence(
            Actions.parallel(
                Actions.fadeIn(0.72f),
                Actions.moveBy(-55f, 0f, 0.72f, Interpolation.pow2Out)
            )
        ));

        Image logotype = new Image(assets.get(VisualAssets.BRAND_LOGOTYPE, Texture.class));
        logotype.setScaling(Scaling.fit);

        Label greeting = new Label(settings.text("¡Te damos la bienvenida!", "Welcome!"), ui.skin(), "subtitle");
        greeting.setColor(ScreenDecor.BRAND_NAVY);

        Label hint = new Label(
            settings.text("Inicia sesión para seguir explorando", "Sign in to keep exploring"),
            ui.skin()
        );
        hint.setColor(ScreenDecor.BRAND_MUTED);
        hint.setFontScale(0.6f);
        greeting.setAlignment(Align.center);
        hint.setAlignment(Align.center);

        Label usernameLabel = fieldLabel(settings.text("Correo", "Email"), ui);
        Label passwordLabel = fieldLabel(settings.text("Contraseña", "Password"), ui);
        TextField.TextFieldStyle fieldStyle = ScreenDecor.lightFieldStyle(assets, ui.skin());

        TextField username = new TextField("", fieldStyle);
        username.setMessageText(settings.text("tu@correo.com", "you@email.com"));
        username.setMaxLength(120);

        TextField password = new TextField("", fieldStyle);
        password.setMessageText("\u2022\u2022\u2022\u2022\u2022\u2022");
        password.setPasswordMode(true);
        password.setPasswordCharacter('\u2022');
        password.setMaxLength(40);

        Label error = new Label("", ui.skin());
        error.setColor(new Color(0.78f, 0.19f, 0.25f, 1f));
        error.setFontScale(0.56f);
        error.setWrap(true);
        error.setAlignment(Align.center);

        TextButton enter = new TextButton(
            settings.text("Iniciar sesi\u00f3n", "Sign in"),
            ScreenDecor.brandButtonStyle(assets, ui.skin())
        );
        enter.addListener(new ClickListener() {
            @Override
            public void clicked(InputEvent event, float x, float y) {
                if (enter.isDisabled()) return;
                error.setText("");
                enter.setDisabled(true);
                enter.setText(settings.text("Verificando...", "Verifying..."));
                navigator.signIn(username.getText(), password.getText(), result -> {
                    if (!result.successful()) {
                        enter.setDisabled(false);
                        enter.setText(settings.text("Iniciar sesión", "Sign in"));
                        error.setText(result.message());
                        return;
                    }
                    password.setText("");
                    playLoginTransition(
                        panel, enter, ui, assets, navigator, settings, result.session()
                    );
                });
            }
        });

        Label footer = new Label("Explorax", ui.skin());
        footer.setColor(new Color(ScreenDecor.BRAND_MUTED.r, ScreenDecor.BRAND_MUTED.g, ScreenDecor.BRAND_MUTED.b, 0.7f));
        footer.setFontScale(0.5f);
        footer.setAlignment(Align.center);

        panel.defaults().width(FIELD_WIDTH);
        panel.add(logotype).width(400f).height(142f).padBottom(26f).row();
        panel.add(greeting).padBottom(4f).row();
        panel.add(hint).padBottom(34f).row();
        panel.add(usernameLabel).padBottom(8f).row();
        panel.add(username).height(80f).padBottom(22f).row();
        panel.add(passwordLabel).padBottom(8f).row();
        panel.add(password).height(80f).row();
        panel.add(error).height(58f).row();
        panel.add(enter).height(100f).row();
        panel.add(footer).padTop(20f);
        stage.addActor(panel);
        SettingsPanel.addTo(stage, settings, ui.skin(), WORLD_HEIGHT, navigator::showLogin);
    }

    private static Label fieldLabel(String text, UiResources ui) {
        Label label = new Label(text, ui.skin());
        label.setColor(ScreenDecor.BRAND_NAVY);
        label.setFontScale(0.58f);
        return label;
    }

    private void playLoginTransition(Table panel, TextButton enter, UiResources ui,
                                     AssetManager assets, GameNavigator navigator,
                                     AppSettings settings, PlayerSession session) {
        enter.setDisabled(true);
        enter.setText(settings.text("Preparando viaje...", "Preparing journey..."));
        panel.clearActions();
        panel.addAction(Actions.sequence(
            Actions.parallel(
                Actions.fadeOut(0.34f, Interpolation.pow2In),
                Actions.moveBy(65f, 0f, 0.34f, Interpolation.pow2In)
            ),
            Actions.run(() -> {
                panel.setVisible(false);
                StarTravelActor travel = new StarTravelActor(
                    ui.skin(),
                    assets.get(VisualAssets.LOGIN_BACKGROUND, Texture.class),
                    assets.get(VisualAssets.MENU_BACKGROUND, Texture.class),
                    WORLD_WIDTH, WORLD_HEIGHT,
                    () -> Gdx.app.postRunnable(
                        () -> navigator.showMainMenu(session)
                    )
                );
                stage.addActor(travel);
            })
        ));
    }
}
