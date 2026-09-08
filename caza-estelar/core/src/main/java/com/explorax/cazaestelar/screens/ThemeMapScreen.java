package com.explorax.cazaestelar.screens;

import com.badlogic.gdx.assets.AssetManager;
import com.badlogic.gdx.scenes.scene2d.InputEvent;
import com.badlogic.gdx.scenes.scene2d.utils.ClickListener;
import com.badlogic.gdx.scenes.scene2d.ui.Label;
import com.badlogic.gdx.scenes.scene2d.ui.Table;
import com.badlogic.gdx.scenes.scene2d.ui.TextButton;
import com.badlogic.gdx.scenes.scene2d.ui.ScrollPane;
import com.explorax.cazaestelar.content.model.ConstellationDefinition;
import com.explorax.cazaestelar.content.model.ThemeDefinition;
import com.explorax.cazaestelar.navigation.GameNavigator;
import com.explorax.cazaestelar.session.PlayerSession;
import com.explorax.cazaestelar.settings.AppSettings;
import com.explorax.cazaestelar.ui.ScreenDecor;
import com.explorax.cazaestelar.ui.SettingsPanel;
import com.explorax.cazaestelar.ui.UiResources;
import com.explorax.cazaestelar.ui.VisualAssets;

public final class ThemeMapScreen extends BaseScreen {
    public ThemeMapScreen(GameNavigator navigator, UiResources ui, AssetManager assets,
                          PlayerSession session, AppSettings settings,
                          ConstellationDefinition constellation) {
        ScreenDecor.addMenuBackground(stage, assets, ui.skin(), WORLD_WIDTH, WORLD_HEIGHT);

        Table panel = new Table();
        panel.setBounds(250f, 125f, 1420f, 830f);
        panel.setBackground(ScreenDecor.drawable(assets, VisualAssets.GLASS_PANEL));
        panel.pad(52f, 70f, 44f, 70f);

        Label breadcrumb = new Label(
            settings.text("Constelación", "Constellation") + "  /  "
                + settings.text(constellation.getTitle().getEs(), constellation.getTitle().getEn()),
            ui.skin(), "subtitle"
        );
        Label title = new Label(settings.text("Elige un tema", "Choose a theme"), ui.skin(), "title");
        title.setFontScale(0.60f);
        panel.add(breadcrumb).left().padBottom(14f).row();
        panel.add(title).left().padBottom(34f).row();

        Table choices = new Table();
        choices.top();
        for (ThemeDefinition theme : constellation.getThemes()) {
            String text = settings.text(theme.getTitle().getEs(), theme.getTitle().getEn())
                + "   ·   " + theme.getMissions().size()
                + settings.text(" misiones", " missions");
            TextButton button = new TextButton(
                text, ScreenDecor.primaryButtonStyle(assets, ui.skin())
            );
            button.getLabel().setFontScale(0.80f);
            button.addListener(new ClickListener() {
                @Override public void clicked(InputEvent event, float x, float y) {
                    navigator.showMissions(session, constellation, theme);
                }
            });
            choices.add(button).width(1260f).height(105f).padBottom(18f).row();
        }
        ScrollPane scroller = new ScrollPane(choices, ui.skin());
        scroller.setFadeScrollBars(false);
        scroller.setScrollingDisabled(true, false);
        panel.add(scroller).width(1280f).height(430f).left().row();

        TextButton back = new TextButton(
            settings.text("Volver a constelaciones", "Back to constellations"),
            ScreenDecor.secondaryButtonStyle(assets, ui.skin())
        );
        back.addListener(new ClickListener() {
            @Override public void clicked(InputEvent event, float x, float y) {
                navigator.showConstellations(session);
            }
        });
        panel.add(back).width(500f).height(72f).left().padTop(22f);
        stage.addActor(panel);
        SettingsPanel.addTo(
            stage, settings, ui.skin(), WORLD_HEIGHT,
            () -> navigator.showThemes(session, constellation), navigator::signOut
        );
    }
}
