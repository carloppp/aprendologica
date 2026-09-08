package com.explorax.cazaestelar.ui;

import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.graphics.Texture;
import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.TextureRegion;
import com.badlogic.gdx.math.Interpolation;
import com.badlogic.gdx.math.MathUtils;
import com.badlogic.gdx.scenes.scene2d.Actor;
import com.badlogic.gdx.scenes.scene2d.Touchable;
import com.badlogic.gdx.scenes.scene2d.ui.Skin;
import com.badlogic.gdx.scenes.scene2d.utils.TextureRegionDrawable;
import java.util.Random;

/** Fast three-stage flight: zoom into the sky, star tunnel and full-scene arrival. */
public final class StarTravelActor extends Actor {
    private static final int STAR_COUNT = 86;
    private static final float DURATION = 3.25f;
    private static final float FINAL_SCENE_ZOOM = 1.018f;
    private static final Color TRAVEL_BLUE = new Color(4f / 255f, 8f / 255f, 32f / 255f, 1f);

    private final TextureRegion pixel;
    private final Texture source;
    private final Texture destination;
    private final float[] angles = new float[STAR_COUNT];
    private final float[] lanes = new float[STAR_COUNT];
    private final float[] sizes = new float[STAR_COUNT];
    private final float[] delays = new float[STAR_COUNT];
    private final Runnable onComplete;
    private float age;
    private boolean completed;

    public StarTravelActor(Skin skin, Texture source, Texture destination,
                           float width, float height,
                           Runnable onComplete) {
        pixel = ((TextureRegionDrawable) skin.getDrawable("white")).getRegion();
        this.source = source;
        this.destination = destination;
        this.onComplete = onComplete;
        setBounds(0f, 0f, width, height);
        setTouchable(Touchable.disabled);

        Random random = new Random(24052026L);
        for (int i = 0; i < STAR_COUNT; i++) {
            angles[i] = random.nextFloat() * MathUtils.PI2;
            lanes[i] = 0.12f + random.nextFloat() * 0.88f;
            sizes[i] = 0.55f + random.nextFloat() * 1.35f;
            delays[i] = random.nextFloat();
        }
    }

    @Override
    public void act(float delta) {
        super.act(delta);
        age += Math.min(delta, 1f / 20f);
        if (!completed && age >= DURATION) {
            completed = true;
            onComplete.run();
        }
    }

    @Override
    public void draw(Batch batch, float parentAlpha) {
        Color previous = new Color(batch.getColor());
        float progress = MathUtils.clamp(age / DURATION, 0f, 1f);
        float launch = Interpolation.pow3In.apply(MathUtils.clamp(progress / 0.28f, 0f, 1f));
        float arrival = Interpolation.smoother.apply(
            MathUtils.clamp((progress - 0.53f) / 0.47f, 0f, 1f)
        );
        float tunnelVisibility = 1f - Interpolation.pow2In.apply(arrival);
        float alpha = parentAlpha * getColor().a;
        float centerX = getX() + getWidth() * 0.5f;
        float centerY = getY() + getHeight() * 0.5f;

        // Exact navy sampled from the approved reference (#040820).
        batch.setColor(TRAVEL_BLUE.r, TRAVEL_BLUE.g, TRAVEL_BLUE.b, alpha);
        batch.draw(pixel, getX(), getY(), getWidth(), getHeight());

        // First fly into the open star field on the right of the login artwork.
        float sourceFade = 1f - Interpolation.pow2In.apply(
            MathUtils.clamp((progress - 0.20f) / 0.18f, 0f, 1f)
        );
        if (sourceFade > 0f) {
            float sourceZoom = 1.018f + launch * 2.75f;
            float targetX = getWidth() * 0.72f;
            float targetY = getHeight() * 0.62f;
            float focusX = centerX + (targetX - centerX) * launch;
            float focusY = centerY + (targetY - centerY) * launch;
            float sourceWidth = getWidth() * sourceZoom;
            float sourceHeight = getHeight() * sourceZoom;
            batch.setColor(1f, 1f, 1f, alpha * sourceFade);
            batch.draw(source,
                centerX - focusX * sourceZoom,
                centerY - focusY * sourceZoom,
                sourceWidth, sourceHeight);

            float blueBlend = Interpolation.pow2In.apply(
                MathUtils.clamp((progress - 0.14f) / 0.22f, 0f, 1f)
            );
            batch.setColor(TRAVEL_BLUE.r, TRAVEL_BLUE.g, TRAVEL_BLUE.b,
                alpha * blueBlend * 0.48f);
            batch.draw(pixel, getX(), getY(), getWidth(), getHeight());
        }

        float tunnelStart = MathUtils.clamp((progress - 0.18f) / 0.24f, 0f, 1f);
        drawTunnel(batch, centerX, centerY, progress, launch,
            tunnelVisibility * Interpolation.fade.apply(tunnelStart), alpha);

        if (arrival > 0f) {
            // Bring the complete observatory in from the distance without focusing the table.
            float approach = Interpolation.pow2Out.apply(arrival);
            float zoom = 0.34f + (FINAL_SCENE_ZOOM - 0.34f) * approach;
            float sceneWidth = getWidth() * zoom;
            float sceneHeight = getHeight() * zoom;
            float sceneX = centerX - sceneWidth * 0.5f;
            float sceneY = centerY - sceneHeight * 0.5f;
            float softness = (1f - arrival) * 14f;

            // Several faint offset copies create a soft-focus arrival without a costly shader.
            if (softness > 0.8f) {
                batch.setColor(0.70f, 0.86f, 1f, alpha * arrival * 0.13f);
                batch.draw(destination, sceneX - softness, sceneY, sceneWidth, sceneHeight);
                batch.draw(destination, sceneX + softness, sceneY, sceneWidth, sceneHeight);
                batch.draw(destination, sceneX, sceneY - softness, sceneWidth, sceneHeight);
                batch.draw(destination, sceneX, sceneY + softness, sceneWidth, sceneHeight);
            }
            batch.setColor(1f, 1f, 1f, alpha * arrival);
            batch.draw(destination, sceneX, sceneY, sceneWidth, sceneHeight);

            // Match the menu's quiet contrast veil at the final frame.
            batch.setColor(0.015f, 0.025f, 0.10f, alpha * arrival * 0.18f);
            batch.draw(pixel, sceneX, sceneY, sceneWidth, sceneHeight);
        }

        // A restrained arrival glow connects the tunnel with the approaching scene.
        float glow = MathUtils.sin(MathUtils.clamp((progress - 0.45f) / 0.32f, 0f, 1f)
            * MathUtils.PI);
        batch.setColor(0.64f, 0.88f, 1f, alpha * glow * 0.16f);
        batch.draw(pixel, getX(), getY(), getWidth(), getHeight());
        batch.setColor(previous);
    }

    private void drawTunnel(Batch batch, float centerX, float centerY, float progress,
                            float launch, float visibility, float parentAlpha) {
        float maxRadius = (float) Math.sqrt(
            getWidth() * getWidth() + getHeight() * getHeight()
        ) * 0.62f;
        for (int i = 0; i < STAR_COUNT; i++) {
            float cycle = (delays[i] + progress * (0.82f + launch * 2.9f)) % 1f;
            float depth = Interpolation.pow3In.apply(cycle);
            float radius = 20f + maxRadius * lanes[i] * depth;
            float length = (8f + 330f * depth * depth) * sizes[i] * (0.30f + launch * 0.70f);
            float thickness = (1.1f + 4.4f * depth) * sizes[i];
            float x = centerX + MathUtils.cos(angles[i]) * radius;
            float y = centerY + MathUtils.sin(angles[i]) * radius;
            float starAlpha = MathUtils.clamp(cycle * 4f, 0f, 1f)
                * visibility * parentAlpha * (0.34f + launch * 0.52f);

            if (i % 5 == 0) batch.setColor(0.55f, 0.90f, 1f, starAlpha);
            else if (i % 5 == 1) batch.setColor(0.76f, 0.61f, 1f, starAlpha);
            else if (i % 5 == 2) batch.setColor(1f, 0.82f, 0.43f, starAlpha);
            else batch.setColor(0.90f, 0.96f, 1f, starAlpha);

            batch.draw(pixel,
                x, y - thickness * 0.5f,
                0f, thickness * 0.5f,
                length, thickness,
                1f, 1f,
                angles[i] * MathUtils.radiansToDegrees);
        }
    }
}
