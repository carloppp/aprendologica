package com.explorax.cazaestelar.screens;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.assets.AssetManager;
import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.graphics.Texture;
import com.badlogic.gdx.math.Interpolation;
import com.badlogic.gdx.scenes.scene2d.InputEvent;
import com.badlogic.gdx.scenes.scene2d.actions.Actions;
import com.badlogic.gdx.scenes.scene2d.ui.Label;
import com.badlogic.gdx.scenes.scene2d.ui.Table;
import com.badlogic.gdx.scenes.scene2d.ui.TextButton;
import com.badlogic.gdx.scenes.scene2d.ui.TextField;
import com.badlogic.gdx.scenes.scene2d.utils.ClickListener;
import com.explorax.cazaestelar.navigation.GameNavigator;
import com.explorax.cazaestelar.session.PlayerSession;
import com.explorax.cazaestelar.settings.AppSettings;
import com.explorax.cazaestelar.ui.ScreenDecor;
import com.explorax.cazaestelar.ui.SettingsPanel;
import com.explorax.cazaestelar.ui.StarTravelActor;
import com.explorax.cazaestelar.ui.UiResources;
import com.explorax.cazaestelar.ui.VisualAssets;

public final class LoginScreen extends BaseScreen {
    public LoginScreen(GameNavigator navigator, UiResources ui, AssetManager assets,
                       AppSettings settings) {
        ScreenDecor.addLoginBackground(stage, assets, ui.skin(), WORLD_WIDTH, WORLD_HEIGHT);

        Table panel = new Table();
        panel.setBounds(1215f, 125f, 595f, 830f);
        panel.setBackground(ScreenDecor.drawable(assets, VisualAssets.GLASS_PANEL));
        panel.pad(62f);
        panel.getColor().a = 0f;
        panel.moveBy(55f, 0f);
        panel.addAction(Actions.sequence(
            Actions.parallel(
                Actions.fadeIn(0.72f),
                Actions.moveBy(-55f, 0f, 0.72f, Interpolation.pow2Out)
            )
        ));

        Label brand = new Label("Explorax", ui.skin(), "subtitle");
        brand.setColor(new Color(0.44f, 0.88f, 1f, 1f));
        Label title = new Label(settings.text("Caza estelar", "Star Hunt"), ui.skin(), "title");
        title.setFontScale(0.78f);

        TextField username = new TextField("", ui.skin());
        username.setMessageText(settings.text("Correo", "Email"));
        username.setMaxLength(120);

        TextField password = new TextField("", ui.skin());
        password.setMessageText(settings.text("Contrase\u00f1a", "Password"));
        password.setPasswordMode(true);
        password.setPasswordCharacter('\u2022');
        password.setMaxLength(40);

        Label error = new Label("", ui.skin());
        error.setColor(new Color(1f, 0.55f, 0.52f, 1f));
        error.setFontScale(0.62f);
        error.setWrap(true);
        error.setAlignment(com.badlogic.gdx.utils.Align.center);

        TextButton enter = new TextButton(
            settings.text("Iniciar sesi\u00f3n", "Sign in"),
            ScreenDecor.primaryButtonStyle(assets, ui.skin())
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

        panel.add(brand).padBottom(14f).row();
        panel.add(title).padBottom(50f).row();
        panel.add(username).width(475f).height(82f).padBottom(24f).row();
        panel.add(password).width(475f).height(82f).padBottom(16f).row();
        panel.add(error).width(475f).height(62f).padBottom(16f).row();
        panel.add(enter).width(475f).height(92f);
        stage.addActor(panel);
        SettingsPanel.addTo(stage, settings, ui.skin(), WORLD_HEIGHT, navigator::showLogin);
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
