package com.explorax.cazaestelar.screens;

import java.util.ArrayList;
import java.util.List;

import com.badlogic.gdx.assets.AssetManager;
import com.badlogic.gdx.files.FileHandle;
import com.badlogic.gdx.graphics.Texture;
import com.badlogic.gdx.audio.Music;
import com.badlogic.gdx.math.Interpolation;
import com.badlogic.gdx.utils.Scaling;
import com.badlogic.gdx.scenes.scene2d.InputEvent;
import com.badlogic.gdx.scenes.scene2d.actions.Actions;
import com.badlogic.gdx.scenes.scene2d.ui.Label;
import com.badlogic.gdx.scenes.scene2d.ui.Image;
import com.badlogic.gdx.scenes.scene2d.ui.Table;
import com.badlogic.gdx.scenes.scene2d.ui.TextButton;
import com.badlogic.gdx.scenes.scene2d.ui.ScrollPane;
import com.badlogic.gdx.scenes.scene2d.utils.ClickListener;
import com.explorax.cazaestelar.content.model.ChoiceOption;
import com.explorax.cazaestelar.content.model.MissionDefinition;
import com.explorax.cazaestelar.content.model.MultipleChoiceConfig;
import com.explorax.cazaestelar.gameplay.ChoiceAnswerResult;
import com.explorax.cazaestelar.gameplay.MultipleChoiceSession;
import com.explorax.cazaestelar.navigation.GameNavigator;
import com.explorax.cazaestelar.session.PlayerSession;
import com.explorax.cazaestelar.settings.AppSettings;
import com.explorax.cazaestelar.ui.ScreenDecor;
import com.explorax.cazaestelar.ui.SettingsPanel;
import com.explorax.cazaestelar.ui.UiResources;
import com.explorax.cazaestelar.ui.VisualAssets;

/** Reusable academic mechanic driven entirely by a published mission definition. */
public final class MultipleChoiceScreen extends BaseScreen {
    private Texture promptTexture;
    private Texture backgroundTexture;
    private Music narration;

    public MultipleChoiceScreen(GameNavigator navigator, UiResources ui, AssetManager assets,
                                PlayerSession session, AppSettings settings,
                                MissionDefinition mission) {
        FileHandle backgroundFile = navigator.cachedMedia(mission.getMedia().getBackgroundAssetId());
        if (backgroundFile != null) {
            try {
                backgroundTexture = ScreenDecor.addCachedBackground(
                    stage, backgroundFile, ui.skin(), WORLD_WIDTH, WORLD_HEIGHT
                );
            } catch (RuntimeException ignored) {
                ScreenDecor.addMenuBackground(stage, assets, ui.skin(), WORLD_WIDTH, WORLD_HEIGHT);
            }
        } else {
            ScreenDecor.addMenuBackground(stage, assets, ui.skin(), WORLD_WIDTH, WORLD_HEIGHT);
        }
        MultipleChoiceConfig config = (MultipleChoiceConfig) mission.getMechanic().getConfig();
        String correctOptionId = config.getOptions().stream()
            .filter(ChoiceOption::getCorrect).findFirst().orElseThrow().getId();
        MultipleChoiceSession choiceSession = new MultipleChoiceSession(
            correctOptionId, config.getAttempts(), mission.getMaximumStars()
        );
        List<TextButton> optionButtons = new ArrayList<>();

        Table activity = new Table();
        activity.setBounds(245f, 75f, 1430f, 930f);
        activity.setBackground(ScreenDecor.drawable(assets, VisualAssets.GLASS_PANEL));
        activity.pad(42f, 70f, 38f, 70f);

        Label title = new Label(
            settings.text(mission.getTitle().getEs(), mission.getTitle().getEn()),
            ui.skin(), "subtitle"
        );
        Label instruction = new Label(
            settings.text(mission.getInstruction().getEs(), mission.getInstruction().getEn()),
            ui.skin()
        );
        instruction.setFontScale(0.66f);
        Label attempts = new Label(attemptsText(settings, choiceSession.getAttemptsRemaining()), ui.skin());
        attempts.setFontScale(0.65f);
        Label question = new Label(
            settings.text(config.getQuestion().getEs(), config.getQuestion().getEn()),
            ui.skin(), "title"
        );
        question.setFontScale(0.48f);
        question.setWrap(true);
        question.setAlignment(com.badlogic.gdx.utils.Align.center);
        Label feedback = new Label("", ui.skin(), "subtitle");
        feedback.setFontScale(0.72f);
        feedback.setWrap(true);
        feedback.setAlignment(com.badlogic.gdx.utils.Align.center);

        activity.add(title).left().expandX();
        activity.add(attempts).right().row();
        activity.add(instruction).colspan(2).width(1290f).left().padTop(8f).padBottom(24f).row();
        activity.add(question).colspan(2).width(1220f).padBottom(26f).row();

        FileHandle promptFile = navigator.cachedMedia(mission.getMedia().getPromptAssetId());
        if (promptFile != null) {
            try {
                promptTexture = new Texture(promptFile);
                promptTexture.setFilter(Texture.TextureFilter.Linear, Texture.TextureFilter.Linear);
                Image promptImage = new Image(promptTexture);
                promptImage.setScaling(Scaling.fit);
                activity.add(promptImage).colspan(2).width(480f).height(190f).padBottom(18f).row();
            } catch (RuntimeException ignored) {
                promptTexture = null;
            }
        }
        FileHandle narrationFile = navigator.cachedMedia(mission.getMedia().getNarrationAssetId());
        if (narrationFile != null && settings.soundEnabled()) {
            try {
                narration = com.badlogic.gdx.Gdx.audio.newMusic(narrationFile);
                narration.setVolume(0.85f);
                narration.play();
            } catch (RuntimeException ignored) {
                narration = null;
            }
        }

        Table choices = new Table();
        for (ChoiceOption option : config.getOptions()) {
            TextButton button = new TextButton(
                settings.text(option.getText().getEs(), option.getText().getEn()),
                ScreenDecor.primaryButtonStyle(assets, ui.skin())
            );
            button.getLabel().setFontScale(0.72f);
            optionButtons.add(button);
            choices.add(button).width(1120f).height(76f).padBottom(12f).row();
        }
        ScrollPane choiceScroller = new ScrollPane(choices, ui.skin());
        choiceScroller.setFadeScrollBars(false);
        choiceScroller.setScrollingDisabled(true, false);
        activity.add(choiceScroller).colspan(2).width(1160f)
            .height(promptTexture == null ? 390f : 275f).top().row();
        activity.add(feedback).colspan(2).width(1220f).height(64f).padTop(8f);
        stage.addActor(activity);

        Table result = new Table();
        result.setBounds(560f, 255f, 800f, 520f);
        result.setBackground(ScreenDecor.drawable(assets, VisualAssets.GLASS_PANEL));
        result.pad(56f);
        result.setVisible(false);
        result.getColor().a = 0f;
        result.setScale(0.84f);
        result.setOrigin(com.badlogic.gdx.utils.Align.center);
        Label resultTitle = new Label("", ui.skin(), "title");
        resultTitle.setFontScale(0.55f);
        Label resultMessage = new Label("", ui.skin(), "subtitle");
        resultMessage.setFontScale(0.82f);
        resultMessage.setWrap(true);
        resultMessage.setAlignment(com.badlogic.gdx.utils.Align.center);
        TextButton replay = new TextButton(
            settings.text("Intentar de nuevo", "Try again"),
            ScreenDecor.primaryButtonStyle(assets, ui.skin())
        );
        TextButton missions = new TextButton(
            settings.text("Volver a misiones", "Back to missions"),
            ScreenDecor.secondaryButtonStyle(assets, ui.skin())
        );
        replay.addListener(new ClickListener() {
            @Override public void clicked(InputEvent event, float x, float y) {
                navigator.showMission(session, mission);
            }
        });
        missions.addListener(new ClickListener() {
            @Override public void clicked(InputEvent event, float x, float y) {
                navigator.showMissionListFor(session, mission);
            }
        });
        result.add(resultTitle).padBottom(22f).row();
        result.add(resultMessage).width(650f).padBottom(34f).row();
        result.add(replay).width(500f).height(82f).padBottom(14f).row();
        result.add(missions).width(500f).height(72f);
        stage.addActor(result);

        for (int index = 0; index < config.getOptions().size(); index++) {
            ChoiceOption option = config.getOptions().get(index);
            TextButton selectedButton = optionButtons.get(index);
            selectedButton.addListener(new ClickListener() {
                @Override public void clicked(InputEvent event, float x, float y) {
                    if (selectedButton.isDisabled() || result.isVisible()) return;
                    ChoiceAnswerResult answer = choiceSession.submit(option.getId());
                    attempts.setText(attemptsText(settings, answer.getAttemptsRemaining()));
                    if (answer.getCorrect()) {
                        optionButtons.forEach(button -> button.setDisabled(true));
                        navigator.recordMissionResult(session, mission, answer.getStarsEarned());
                        feedback.setText(settings.text(
                            config.getSuccessFeedback().getEs(), config.getSuccessFeedback().getEn()
                        ));
                        showResult(
                            result, resultTitle, resultMessage,
                            settings.text("¡Respuesta correcta!", "Correct answer!"),
                            settings.text("Estrellas obtenidas: ", "Stars earned: ") + answer.getStarsEarned()
                                + " / " + mission.getMaximumStars()
                        );
                        return;
                    }

                    selectedButton.setDisabled(true);
                    feedback.setText(settings.text(
                        config.getRetryFeedback().getEs(), config.getRetryFeedback().getEn()
                    ));
                    if (answer.getFinished()) {
                        optionButtons.forEach(button -> button.setDisabled(true));
                        navigator.recordMissionResult(session, mission, 0);
                        showResult(
                            result, resultTitle, resultMessage,
                            settings.text("Misión por completar", "Mission not completed"),
                            settings.text("No obtuviste estrellas esta vez.", "You did not earn stars this time.")
                        );
                    }
                }
            });
        }

        SettingsPanel.addTo(
            stage, settings, ui.skin(), WORLD_HEIGHT,
            () -> navigator.showMission(session, mission), navigator::signOut
        );
    }

    private static String attemptsText(AppSettings settings, int remaining) {
        return settings.text("Intentos: ", "Attempts: ") + remaining;
    }

    private static void showResult(Table result, Label title, Label message,
                                   String titleText, String messageText) {
        title.setText(titleText);
        message.setText(messageText);
        result.setVisible(true);
        result.addAction(Actions.parallel(
            Actions.fadeIn(0.42f),
            Actions.scaleTo(1f, 1f, 0.50f, Interpolation.swingOut)
        ));
    }

    @Override public void dispose() {
        super.dispose();
        if (promptTexture != null) promptTexture.dispose();
        if (backgroundTexture != null) backgroundTexture.dispose();
        if (narration != null) narration.dispose();
    }
}
