package com.explorax.cazaestelar.screens;

import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.scenes.scene2d.InputEvent;
import com.badlogic.gdx.scenes.scene2d.ui.Image;
import com.badlogic.gdx.scenes.scene2d.ui.Label;
import com.badlogic.gdx.scenes.scene2d.ui.Table;
import com.badlogic.gdx.scenes.scene2d.ui.TextButton;
import com.badlogic.gdx.scenes.scene2d.utils.ClickListener;
import com.explorax.cazaestelar.navigation.GameNavigator;
import com.explorax.cazaestelar.settings.AppSettings;
import com.explorax.cazaestelar.ui.UiResources;

/** Generic recovery UI. Internal exception details are intentionally never displayed. */
public final class RecoveryScreen extends BaseScreen {
    public RecoveryScreen(GameNavigator navigator, UiResources ui, AppSettings settings) {
        Image background = new Image(ui.skin().newDrawable(
            "white", new Color(0.018f, 0.03f, 0.11f, 1f)
        ));
        background.setBounds(0f, 0f, WORLD_WIDTH, WORLD_HEIGHT);
        stage.addActor(background);

        Label title = new Label(
            settings.text("Viaje interrumpido", "Journey interrupted"),
            ui.skin(), "title"
        );
        title.setFontScale(0.68f);
        Label message = new Label(
            settings.text(
                "Tus avances siguen guardados. Vuelve al acceso para continuar.",
                "Your progress is still saved. Return to sign in to continue."
            ),
            ui.skin()
        );
        message.setWrap(true);
        message.setAlignment(com.badlogic.gdx.utils.Align.center);

        TextButton recover = new TextButton(
            settings.text("Volver al acceso", "Return to sign in"), ui.skin()
        );
        recover.addListener(new ClickListener() {
            @Override public void clicked(InputEvent event, float x, float y) {
                if (recover.isDisabled()) return;
                recover.setDisabled(true);
                navigator.showLogin();
            }
        });

        Table panel = new Table();
        panel.setFillParent(true);
        panel.add(title).padBottom(42f).row();
        panel.add(message).width(920f).padBottom(52f).row();
        panel.add(recover).width(470f).height(92f);
        stage.addActor(panel);
    }
}
