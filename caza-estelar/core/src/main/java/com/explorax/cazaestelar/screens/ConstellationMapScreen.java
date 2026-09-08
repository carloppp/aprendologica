package com.explorax.cazaestelar.screens;

import com.badlogic.gdx.assets.AssetManager;
import com.badlogic.gdx.scenes.scene2d.InputEvent;
import com.badlogic.gdx.scenes.scene2d.utils.ClickListener;
import com.badlogic.gdx.scenes.scene2d.ui.Label;
import com.badlogic.gdx.scenes.scene2d.ui.Table;
import com.badlogic.gdx.scenes.scene2d.ui.TextButton;
import com.badlogic.gdx.scenes.scene2d.ui.ScrollPane;
import com.explorax.cazaestelar.content.model.ConstellationDefinition;
import com.explorax.cazaestelar.content.model.ContentCatalog;
import com.explorax.cazaestelar.navigation.GameNavigator;
import com.explorax.cazaestelar.session.PlayerSession;
import com.explorax.cazaestelar.settings.AppSettings;
import com.explorax.cazaestelar.ui.ScreenDecor;
import com.explorax.cazaestelar.ui.SettingsPanel;
import com.explorax.cazaestelar.ui.UiResources;
import com.explorax.cazaestelar.ui.VisualAssets;

/** Entry point for the content-driven learning journey. */
public final class ConstellationMapScreen extends BaseScreen {
    public ConstellationMapScreen(GameNavigator navigator, UiResources ui, AssetManager assets,
                                  PlayerSession session, AppSettings settings,
                                  ContentCatalog catalog) {
        ScreenDecor.addMenuBackground(stage, assets, ui.skin(), WORLD_WIDTH, WORLD_HEIGHT);

        Table panel = new Table();
        panel.setBounds(190f, 105f, 1540f, 870f);
        panel.setBackground(ScreenDecor.drawable(assets, VisualAssets.GLASS_PANEL));
        panel.pad(52f, 70f, 46f, 70f);

        Label title = new Label(
            settings.text("Elige una constelación", "Choose a constellation"),
            ui.skin(), "title"
        );
        title.setFontScale(0.62f);
        Label subtitle = new Label(settings.text(
            "Cada constelación contiene temas y misiones creadas por el equipo académico.",
            "Each constellation contains themes and missions created by the academic team."
        ), ui.skin());
        subtitle.setFontScale(0.72f);
        subtitle.setWrap(true);

        panel.add(title).left().padBottom(14f).row();
        panel.add(subtitle).width(1320f).left().padBottom(36f).row();

        Table choices = new Table();
        choices.top();
        for (ConstellationDefinition constellation : catalog.getConstellations()) {
            int missionCount = constellation.getThemes().stream()
                .mapToInt(theme -> theme.getMissions().size()).sum();
            String text = settings.text(
                constellation.getTitle().getEs(), constellation.getTitle().getEn()
            ) + settings.text("   ·   ", "   ·   ")
                + constellation.getThemes().size()
                + settings.text(" temas   ·   ", " themes   ·   ")
                + missionCount + settings.text(" misiones", " missions");
            TextButton button = new TextButton(
                text, ScreenDecor.primaryButtonStyle(assets, ui.skin())
            );
            button.getLabel().setFontScale(0.78f);
            button.addListener(new ClickListener() {
                @Override public void clicked(InputEvent event, float x, float y) {
                    navigator.showThemes(session, constellation);
                }
            });
            choices.add(button).width(1300f).height(105f).padBottom(18f).row();
        }
        ScrollPane scroller = new ScrollPane(choices, ui.skin());
        scroller.setFadeScrollBars(false);
        scroller.setScrollingDisabled(true, false);
        panel.add(scroller).width(1320f).height(455f).left().row();

        TextButton back = new TextButton(
            settings.text("Volver al observatorio", "Back to observatory"),
            ScreenDecor.secondaryButtonStyle(assets, ui.skin())
        );
        back.addListener(new ClickListener() {
            @Override public void clicked(InputEvent event, float x, float y) {
                navigator.showMainMenu(session);
            }
        });
        panel.add(back).width(500f).height(72f).left().padTop(22f);
        stage.addActor(panel);
        SettingsPanel.addTo(
            stage, settings, ui.skin(), WORLD_HEIGHT,
            () -> navigator.showConstellations(session), navigator::signOut
        );
    }
}
