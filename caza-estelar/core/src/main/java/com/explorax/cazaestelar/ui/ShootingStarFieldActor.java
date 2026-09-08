package com.explorax.cazaestelar.ui;

import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.TextureRegion;
import com.badlogic.gdx.math.MathUtils;
import com.badlogic.gdx.scenes.scene2d.Actor;
import com.badlogic.gdx.scenes.scene2d.Touchable;
import com.badlogic.gdx.scenes.scene2d.ui.Skin;
import com.badlogic.gdx.scenes.scene2d.utils.TextureRegionDrawable;
import com.badlogic.gdx.utils.Array;

import java.util.Random;

/** A lightweight, reusable layer of diagonal shooting stars for menu backgrounds. */
public final class ShootingStarFieldActor extends Actor {
    private static final float ANGLE_DEGREES = 34f;
    private static final int MAX_ACTIVE = 6;
    private static final Color CYAN = new Color(0.38f, 0.88f, 1f, 1f);
    private static final Color GOLD = new Color(1f, 0.80f, 0.34f, 1f);
    private static final Color VIOLET = new Color(0.72f, 0.55f, 1f, 1f);

    private final TextureRegion pixel;
    private final Array<ShootingStar> active = new Array<>();
    private final Random random = new Random(17081999L);
    private float spawnTimer = 0.35f;

    public ShootingStarFieldActor(Skin skin, float width, float height) {
        pixel = ((TextureRegionDrawable) skin.getDrawable("white")).getRegion();
        setBounds(0f, 0f, width, height);
        setTouchable(Touchable.disabled);
    }

    @Override
    public void act(float delta) {
        super.act(delta);
        float safeDelta = Math.min(delta, 1f / 20f);
        spawnTimer -= safeDelta;
        if (spawnTimer <= 0f && active.size < MAX_ACTIVE) {
            spawnStar();
            spawnTimer = 0.42f + random.nextFloat() * 1.15f;
        }

        for (int i = active.size - 1; i >= 0; i--) {
            ShootingStar star = active.get(i);
            star.age += safeDelta;
            star.x -= star.speed * safeDelta;
            star.y -= star.speed * 0.67f * safeDelta;
            if (star.age >= star.life || star.x < -star.trailLength || star.y < -80f) {
                active.removeIndex(i);
            }
        }
    }

    private void spawnStar() {
        ShootingStar star = new ShootingStar();
        star.x = getWidth() * (0.84f + random.nextFloat() * 0.30f);
        star.y = getHeight() * (0.66f + random.nextFloat() * 0.43f);
        star.speed = 560f + random.nextFloat() * 380f;
        star.trailLength = 150f + random.nextFloat() * 220f;
        star.thickness = 2.8f + random.nextFloat() * 3.7f;
        star.life = 1.5f + random.nextFloat() * 1.1f;
        star.colorIndex = random.nextInt(3);
        active.add(star);
    }

    @Override
    public void draw(Batch batch, float parentAlpha) {
        parentAlpha *= getColor().a;
        Color previous = new Color(batch.getColor());
        for (ShootingStar star : active) {
            float fadeIn = MathUtils.clamp(star.age / 0.16f, 0f, 1f);
            float fadeOut = MathUtils.clamp((star.life - star.age) / 0.42f, 0f, 1f);
            float alpha = fadeIn * fadeOut * parentAlpha;
            Color tint = tintFor(star.colorIndex);

            // Three overlapping trails create a soft gradient without extra textures.
            drawTrail(batch, star, star.trailLength, star.thickness * 2.4f, tint, alpha * 0.10f);
            drawTrail(batch, star, star.trailLength * 0.78f, star.thickness * 1.35f, tint, alpha * 0.28f);
            drawTrail(batch, star, star.trailLength * 0.48f, star.thickness, tint, alpha * 0.62f);

            drawStarHead(batch, star, tint, alpha);
        }
        batch.setColor(previous);
    }

    private void drawStarHead(Batch batch, ShootingStar star, Color tint, float alpha) {
        float core = star.thickness * 2.1f;
        drawRay(batch, star.x, star.y, core * 4.2f, core * 0.40f, 45f,
            tint, alpha * 0.42f);
        drawRay(batch, star.x, star.y, core * 4.2f, core * 0.40f, 135f,
            tint, alpha * 0.42f);
        drawRay(batch, star.x, star.y, core * 2.6f, core * 0.30f, 0f,
            Color.WHITE, alpha * 0.88f);
        drawRay(batch, star.x, star.y, core * 2.6f, core * 0.30f, 90f,
            Color.WHITE, alpha * 0.88f);
        batch.setColor(1f, 0.97f, 0.82f, alpha);
        batch.draw(pixel, star.x - core / 2f, star.y - core / 2f,
            core / 2f, core / 2f, core, core, 1f, 1f, 45f);
    }

    private void drawRay(Batch batch, float x, float y, float length, float thickness,
                         float rotation, Color color, float alpha) {
        batch.setColor(color.r, color.g, color.b, alpha);
        batch.draw(pixel, x - length / 2f, y - thickness / 2f,
            length / 2f, thickness / 2f, length, thickness,
            1f, 1f, rotation);
    }

    private void drawTrail(Batch batch, ShootingStar star, float length, float thickness,
                           Color color, float alpha) {
        batch.setColor(color.r, color.g, color.b, alpha);
        batch.draw(pixel,
            star.x, star.y - thickness / 2f,
            0f, thickness / 2f,
            length, thickness,
            1f, 1f,
            ANGLE_DEGREES);
    }

    private Color tintFor(int index) {
        return switch (index) {
            case 1 -> GOLD;
            case 2 -> VIOLET;
            default -> CYAN;
        };
    }

    private static final class ShootingStar {
        float x;
        float y;
        float speed;
        float trailLength;
        float thickness;
        float life;
        float age;
        int colorIndex;
    }
}
