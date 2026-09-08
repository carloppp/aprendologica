package com.explorax.cazaestelar.ui;

import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.scenes.scene2d.Actor;
import com.badlogic.gdx.scenes.scene2d.ui.Skin;
import com.badlogic.gdx.scenes.scene2d.utils.TextureRegionDrawable;
import com.badlogic.gdx.utils.Array;

import java.util.Random;

public final class StarFieldActor extends Actor {
    private final TextureRegionDrawable pixel;
    private final Array<Star> stars = new Array<>();
    private float time;

    public StarFieldActor(Skin skin, float width, float height, int count) {
        pixel = (TextureRegionDrawable) skin.getDrawable("white");
        setBounds(0f, 0f, width, height);
        Random random = new Random(20260812L);
        for (int i = 0; i < count; i++) {
            stars.add(new Star(
                random.nextFloat() * width,
                random.nextFloat() * height,
                2f + random.nextFloat() * 7f,
                random.nextFloat() * 6.283f,
                0.45f + random.nextFloat() * 1.2f
            ));
        }
        setTouchable(com.badlogic.gdx.scenes.scene2d.Touchable.disabled);
    }

    @Override
    public void act(float delta) {
        super.act(delta);
        time += delta;
    }

    @Override
    public void draw(Batch batch, float parentAlpha) {
        parentAlpha *= getColor().a;
        Color old = new Color(batch.getColor());
        for (Star star : stars) {
            float pulse = 0.55f + 0.45f * (float) Math.sin(time * star.speed + star.phase);
            float size = star.size * (0.75f + pulse * 0.35f);
            batch.setColor(0.70f + pulse * 0.25f, 0.85f, 1f, parentAlpha * (0.25f + pulse * 0.58f));
            pixel.draw(batch, star.x - size / 2f, star.y - size / 2f, size, size);
        }
        batch.setColor(old);
    }

    private record Star(float x, float y, float size, float phase, float speed) {
    }
}
