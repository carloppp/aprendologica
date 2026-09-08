package com.explorax.cazaestelar.screens;

import com.badlogic.gdx.assets.AssetManager;
import com.badlogic.gdx.math.Interpolation;
import com.badlogic.gdx.scenes.scene2d.InputEvent;
import com.badlogic.gdx.scenes.scene2d.actions.Actions;
import com.badlogic.gdx.scenes.scene2d.ui.Label;
import com.badlogic.gdx.scenes.scene2d.ui.Table;
import com.badlogic.gdx.scenes.scene2d.ui.TextButton;
import com.badlogic.gdx.scenes.scene2d.utils.ClickListener;
import com.explorax.cazaestelar.navigation.GameNavigator;
import com.explorax.cazaestelar.session.PlayerSession;
import com.explorax.cazaestelar.settings.AppSettings;
import com.explorax.cazaestelar.ui.ScreenDecor;
import com.explorax.cazaestelar.ui.SettingsPanel;
import com.explorax.cazaestelar.ui.TelescopeHuntActor;
import com.explorax.cazaestelar.ui.UiResources;
import com.explorax.cazaestelar.ui.VisualAssets;
import com.explorax.cazaestelar.content.model.MissionDefinition;
import com.explorax.cazaestelar.content.model.TelescopeHuntConfig;

/** Introductory mission: aim the telescope and capture three bright stars. */
public final class TelescopeHuntScreen extends BaseScreen {
    public TelescopeHuntScreen(GameNavigator navigator, UiResources ui, AssetManager assets,
                               PlayerSession session, AppSettings settings,
                               MissionDefinition mission) {
        ScreenDecor.addTelescopeBackground(stage, assets, ui.skin(), WORLD_WIDTH, WORLD_HEIGHT);
        TelescopeHuntConfig config = (TelescopeHuntConfig) mission.getMechanic().getConfig();

        Label counter = new Label(
            settings.text("Estrellas  0 / ", "Stars  0 / ")
                + config.getTargetCount(), ui.skin(), "subtitle"
        );
        final TextButton[] captureRef = new TextButton[1];
        Table result = buildResult(navigator, ui, assets, session, settings, mission);
        TelescopeHuntActor field = new TelescopeHuntActor(
            ui.skin(), WORLD_WIDTH, WORLD_HEIGHT,
            config.getTargetCount(), config.getLockRadius(),
            new TelescopeHuntActor.Listener() {
                @Override public void onCapture(int captured, int total) {
                    counter.setText(settings.text("Estrellas  ", "Stars  ") + captured + " / " + total);
                    counter.addAction(Actions.sequence(
                        Actions.scaleTo(1.12f, 1.12f, 0.12f),
                        Actions.scaleTo(1f, 1f, 0.22f, Interpolation.swingOut)
                    ));
                }

                @Override public void onComplete() {
                    captureRef[0].setDisabled(true);
                    navigator.recordMissionResult(session, mission, mission.getMaximumStars());
                    result.setVisible(true);
                    result.addAction(Actions.parallel(
                        Actions.fadeIn(0.46f),
                        Actions.scaleTo(1f, 1f, 0.55f, Interpolation.swingOut)
                    ));
                }
            });
        stage.addActor(field);

        Table header = new Table();
        header.setBounds(55f, 865f, 780f, 165f);
        header.setBackground(ScreenDecor.drawable(assets, VisualAssets.GLASS_PANEL));
        header.pad(22f, 34f, 22f, 34f);
        Label title = new Label(
            settings.text(mission.getTitle().getEs(), mission.getTitle().getEn()),
            ui.skin(), "subtitle"
        );
        Label help = new Label(settings.text(
            mission.getInstruction().getEs(), mission.getInstruction().getEn()
        ), ui.skin());
        help.setFontScale(0.72f);
        header.add(title).left().row();
        header.add(help).left().padTop(10f);
        stage.addActor(header);

        Table controls = new Table();
        controls.setBounds(1395f, 80f, 460f, 285f);
        controls.setBackground(ScreenDecor.drawable(assets, VisualAssets.GLASS_PANEL));
        controls.pad(28f);
        counter.setOrigin(com.badlogic.gdx.utils.Align.center);
        TextButton capture = new TextButton(
            settings.text("Capturar estrella", "Capture star"),
            ScreenDecor.primaryButtonStyle(assets, ui.skin())
        );
        captureRef[0] = capture;
        TextButton back = new TextButton(
            settings.text("Volver al observatorio", "Back to observatory"),
            ScreenDecor.secondaryButtonStyle(assets, ui.skin())
        );
        capture.addListener(new ClickListener() {
            @Override public void clicked(InputEvent event, float x, float y) {
                if (!capture.isDisabled() && !field.capture()) {
                    capture.setText(settings.text("Alinea mejor la mira", "Align the sight better"));
                    capture.addAction(Actions.sequence(
                        Actions.delay(0.55f), Actions.run(() -> capture.setText(
                            settings.text("Capturar estrella", "Capture star")
                        ))
                    ));
                }
            }
        });
        back.addListener(new ClickListener() {
            @Override public void clicked(InputEvent event, float x, float y) {
                navigator.showMissionListFor(session, mission);
            }
        });
        controls.add(counter).padBottom(20f).row();
        controls.add(capture).width(400f).height(88f).padBottom(14f).row();
        controls.add(back).width(400f).height(72f);
        stage.addActor(controls);
        stage.addActor(result);
        SettingsPanel.addTo(
            stage, settings, ui.skin(), WORLD_HEIGHT,
            () -> navigator.showMission(session, mission), navigator::signOut
        );
    }

    private Table buildResult(GameNavigator navigator, UiResources ui, AssetManager assets,
                              PlayerSession session, AppSettings settings,
                              MissionDefinition mission) {
        Table result = new Table();
        result.setBounds(560f, 275f, 800f, 500f);
        result.setBackground(ScreenDecor.drawable(assets, VisualAssets.GLASS_PANEL));
        result.pad(58f);
        result.getColor().a = 0f;
        result.setScale(0.82f);
        result.setOrigin(com.badlogic.gdx.utils.Align.center);
        result.setVisible(false);
        Label title = new Label(
            settings.text("¡Misión completada!", "Mission completed!"),
            ui.skin(), "title"
        );
        title.setFontScale(0.58f);
        Label message = new Label(settings.text(
            "El observatorio vuelve a brillar", "The observatory shines again"
        ), ui.skin());
        TextButton replay = new TextButton(
            settings.text("Jugar de nuevo", "Play again"),
            ScreenDecor.primaryButtonStyle(assets, ui.skin())
        );
        TextButton menu = new TextButton(
            settings.text("Volver al observatorio", "Back to observatory"),
            ScreenDecor.secondaryButtonStyle(assets, ui.skin())
        );
        replay.addListener(new ClickListener() {
            @Override public void clicked(InputEvent event, float x, float y) {
                navigator.showMission(session, mission);
            }
        });
        menu.addListener(new ClickListener() {
            @Override public void clicked(InputEvent event, float x, float y) {
                navigator.showMissionListFor(session, mission);
            }
        });
        result.add(title).padBottom(26f).row();
        result.add(message).padBottom(44f).row();
        result.add(replay).width(480f).height(88f).padBottom(16f).row();
        result.add(menu).width(480f).height(78f);
        return result;
    }
}
