package com.explorax.cazaestelar.screens;

import com.badlogic.gdx.assets.AssetManager;
import com.badlogic.gdx.scenes.scene2d.InputEvent;
import com.badlogic.gdx.scenes.scene2d.utils.ClickListener;
import com.badlogic.gdx.scenes.scene2d.ui.Label;
import com.badlogic.gdx.scenes.scene2d.ui.Table;
import com.badlogic.gdx.scenes.scene2d.ui.TextButton;
import com.badlogic.gdx.scenes.scene2d.ui.ScrollPane;
import com.explorax.cazaestelar.content.model.ConstellationDefinition;
import com.explorax.cazaestelar.content.model.MissionDefinition;
import com.explorax.cazaestelar.content.model.ThemeDefinition;
import com.explorax.cazaestelar.progress.MissionProgress;
import com.explorax.cazaestelar.navigation.GameNavigator;
import com.explorax.cazaestelar.session.PlayerSession;
import com.explorax.cazaestelar.settings.AppSettings;
import com.explorax.cazaestelar.ui.ScreenDecor;
import com.explorax.cazaestelar.ui.SettingsPanel;
import com.explorax.cazaestelar.ui.UiResources;
import com.explorax.cazaestelar.ui.VisualAssets;

public final class MissionListScreen extends BaseScreen {
    public MissionListScreen(GameNavigator navigator, UiResources ui, AssetManager assets,
                             PlayerSession session, AppSettings settings,
                             ConstellationDefinition constellation, ThemeDefinition theme) {
        ScreenDecor.addMenuBackground(stage, assets, ui.skin(), WORLD_WIDTH, WORLD_HEIGHT);

        Table panel = new Table();
        panel.setBounds(250f, 105f, 1420f, 870f);
        panel.setBackground(ScreenDecor.drawable(assets, VisualAssets.GLASS_PANEL));
        panel.pad(48f, 70f, 42f, 70f);

        Label breadcrumb = new Label(
            settings.text(constellation.getTitle().getEs(), constellation.getTitle().getEn())
                + "  /  " + settings.text(theme.getTitle().getEs(), theme.getTitle().getEn()),
            ui.skin(), "subtitle"
        );
        Label title = new Label(settings.text("Misiones", "Missions"), ui.skin(), "title");
        title.setFontScale(0.60f);
        panel.add(breadcrumb).left().padBottom(12f).row();
        panel.add(title).left().padBottom(30f).row();

        Table choices = new Table();
        choices.top();
        int index = 1;
        for (MissionDefinition mission : theme.getMissions()) {
            boolean compatible = navigator.isMissionPlayable(mission);
            boolean unlocked = navigator.isMissionUnlocked(session, mission);
            boolean playable = compatible && unlocked;
            MissionProgress progress = navigator.missionProgress(session, mission);
            String label = index + ".  "
                + settings.text(mission.getTitle().getEs(), mission.getTitle().getEn());
            if (!compatible) {
                label += settings.text("   ·   No disponible en esta versión", "   ·   Not available in this version");
            } else if (!unlocked) {
                label += settings.text("   ·   Bloqueada", "   ·   Locked");
            } else if (progress != null && progress.getCompleted()) {
                label += "   ·   " + progress.getBestStars() + " / " + mission.getMaximumStars()
                    + settings.text(" estrellas", " stars");
            } else {
                label += settings.text("   ·   Disponible", "   ·   Available");
            }
            TextButton button = new TextButton(
                label, ScreenDecor.primaryButtonStyle(assets, ui.skin())
            );
            button.getLabel().setFontScale(0.72f);
            button.setDisabled(!playable);
            if (playable) {
                button.addListener(new ClickListener() {
                    @Override public void clicked(InputEvent event, float x, float y) {
                        navigator.showMission(session, mission);
                    }
                });
            }
            choices.add(button).width(1260f).height(100f).padBottom(16f).row();
            index++;
        }
        ScrollPane scroller = new ScrollPane(choices, ui.skin());
        scroller.setFadeScrollBars(false);
        scroller.setScrollingDisabled(true, false);
        panel.add(scroller).width(1280f).height(460f).left().row();

        TextButton back = new TextButton(
            settings.text("Volver a temas", "Back to themes"),
            ScreenDecor.secondaryButtonStyle(assets, ui.skin())
        );
        back.addListener(new ClickListener() {
            @Override public void clicked(InputEvent event, float x, float y) {
                navigator.showThemes(session, constellation);
            }
        });
        panel.add(back).width(500f).height(72f).left().padTop(22f);
        stage.addActor(panel);
        SettingsPanel.addTo(
            stage, settings, ui.skin(), WORLD_HEIGHT,
            () -> navigator.showMissions(session, constellation, theme), navigator::signOut
        );
    }
}
