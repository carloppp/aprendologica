package com.explorax.cazaestelar.screens;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.ScreenAdapter;
import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.graphics.GL20;
import com.badlogic.gdx.scenes.scene2d.Stage;
import com.badlogic.gdx.utils.viewport.FitViewport;

abstract class BaseScreen extends ScreenAdapter {
    static final float WORLD_WIDTH = 1920f;
    static final float WORLD_HEIGHT = 1080f;
    static final Color DEFAULT_CLEAR = new Color(0.025f, 0.035f, 0.12f, 1f);
    final Stage stage = new Stage(new FitViewport(WORLD_WIDTH, WORLD_HEIGHT));
    /** Color de las franjas fuera del área 16:9 y de todo lo no cubierto por el stage. */
    final Color clearColor = new Color(DEFAULT_CLEAR);

    @Override
    public void show() {
        Gdx.input.setInputProcessor(stage);
    }

    @Override
    public void render(float delta) {
        Gdx.gl.glClearColor(clearColor.r, clearColor.g, clearColor.b, 1f);
        Gdx.gl.glClear(GL20.GL_COLOR_BUFFER_BIT);
        stage.act(Math.min(delta, 1f / 30f));
        stage.draw();
    }

    @Override
    public void resize(int width, int height) {
        stage.getViewport().update(width, height, true);
    }

    @Override
    public void dispose() {
        stage.dispose();
    }
}
