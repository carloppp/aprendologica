package com.explorax.cazaestelar.screens;

import com.badlogic.gdx.assets.AssetManager;
import com.badlogic.gdx.scenes.scene2d.actions.Actions;
import com.badlogic.gdx.scenes.scene2d.ui.Label;
import com.badlogic.gdx.scenes.scene2d.ui.Table;
import com.badlogic.gdx.scenes.scene2d.ui.TextButton;
import com.explorax.cazaestelar.navigation.GameNavigator;
import com.explorax.cazaestelar.session.PlayerSession;
import com.explorax.cazaestelar.settings.AppSettings;
import com.explorax.cazaestelar.ui.ScreenDecor;
import com.explorax.cazaestelar.ui.SettingsPanel;
import com.explorax.cazaestelar.ui.UiResources;

public final class MainMenuScreen extends BaseScreen {
    public MainMenuScreen(GameNavigator navigator, UiResources ui, AssetManager assets,
                          PlayerSession session, AppSettings settings) {
        ScreenDecor.addMenuBackground(stage, assets, ui.skin(), WORLD_WIDTH, WORLD_HEIGHT);
        Table menu = new Table();
        menu.setBounds(1200f, 115f, 620f, 850f);
        menu.setBackground(ScreenDecor.drawable(assets, com.explorax.cazaestelar.ui.VisualAssets.GLASS_PANEL));
        menu.pad(52f);
        menu.getColor().a = 0f;
        menu.moveBy(72f, 0f);
        menu.setScale(0.96f);
        menu.setOrigin(com.badlogic.gdx.utils.Align.center);
        menu.addAction(Actions.sequence(
            Actions.delay(0.10f),
            Actions.parallel(
                Actions.fadeIn(0.52f, com.badlogic.gdx.math.Interpolation.pow2Out),
                Actions.moveBy(-72f, 0f, 0.52f, com.badlogic.gdx.math.Interpolation.pow2Out),
                Actions.scaleTo(1f, 1f, 0.64f, com.badlogic.gdx.math.Interpolation.swingOut)
            )
        ));
        Label title = new Label(settings.text("Caza Estelar", "Star Hunt"), ui.skin(), "title");
        title.setFontScale(0.70f);
        title.setAlignment(com.badlogic.gdx.utils.Align.center);
        Label welcome = new Label(
            settings.text("Hola, ", "Hello, ") + session.displayName(), ui.skin()
        );
        TextButton play = new TextButton(
            settings.text("Comenzar aventura", "Start adventure"),
            ScreenDecor.primaryButtonStyle(assets, ui.skin())
        );
        play.addListener(new com.badlogic.gdx.scenes.scene2d.utils.ClickListener() {
            @Override public void clicked(com.badlogic.gdx.scenes.scene2d.InputEvent event,
                                          float x, float y) {
                if (play.isDisabled()) return;
                play.setDisabled(true);
                play.setText(settings.text("Actualizando contenido...", "Updating content..."));
                navigator.refreshAndShowConstellations(session);
            }
        });

        menu.add(title).width(510f).padBottom(24f).row();
        menu.add(welcome).padBottom(48f).row();
        menu.add(play).width(500f).height(92f);
        stage.addActor(menu);
        SettingsPanel.addTo(
            stage, settings, ui.skin(), WORLD_HEIGHT,
            () -> navigator.showMainMenu(session), navigator::signOut
        );
    }
}
