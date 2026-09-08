package com.explorax.cazaestelar.ui;

import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.graphics.Texture;
import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.math.MathUtils;
import com.badlogic.gdx.scenes.scene2d.Actor;
import com.badlogic.gdx.scenes.scene2d.Touchable;

/** Draws the character scene with a restrained cinematic drift. */
public final class AnimatedBackgroundActor extends Actor {
    private final Texture characters;
    private float time;

    public AnimatedBackgroundActor(Texture characters, float width, float height) {
        this.characters = characters;
        setBounds(0f, 0f, width, height);
        setTouchable(Touchable.disabled);
    }

    @Override
    public void act(float delta) {
        super.act(delta);
        time += Math.min(delta, 1f / 20f);
    }

    @Override
    public void draw(Batch batch, float parentAlpha) {
        parentAlpha *= getColor().a;
        Color previous = new Color(batch.getColor());
        drawScene(batch, characters, parentAlpha, 1f, 0f);
        batch.setColor(previous);
    }

    private void drawScene(Batch batch, Texture texture, float parentAlpha, float alpha, float phaseOffset) {
        float zoom = 1.018f + 0.008f * MathUtils.sin(time * 0.18f + phaseOffset);
        float width = getWidth() * zoom;
        float height = getHeight() * zoom;
        float driftX = MathUtils.sin(time * 0.11f + phaseOffset) * 10f;
        float driftY = MathUtils.cos(time * 0.09f + phaseOffset) * 5f;
        float x = getX() - (width - getWidth()) / 2f + driftX;
        float y = getY() - (height - getHeight()) / 2f + driftY;
        batch.setColor(1f, 1f, 1f, alpha * parentAlpha);
        batch.draw(texture, x, y, width, height);
    }
}
