package com.explorax.cazaestelar.ui;

import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.TextureRegion;
import com.badlogic.gdx.math.Interpolation;
import com.badlogic.gdx.math.MathUtils;
import com.badlogic.gdx.scenes.scene2d.Actor;
import com.badlogic.gdx.scenes.scene2d.InputEvent;
import com.badlogic.gdx.scenes.scene2d.InputListener;
import com.badlogic.gdx.scenes.scene2d.ui.Skin;
import com.badlogic.gdx.scenes.scene2d.utils.TextureRegionDrawable;
import com.explorax.cazaestelar.gameplay.StarHuntSession;

/** Touch-controlled telescope sight and three-star capture field. */
public final class TelescopeHuntActor extends Actor {
    public interface Listener {
        void onCapture(int captured, int total);
        void onComplete();
    }

    private static final float[] STAR_X = {420f, 795f, 1125f, 610f, 980f, 1280f};
    private static final float[] STAR_Y = {785f, 610f, 850f, 905f, 735f, 560f};
    private final TextureRegion pixel;
    private final StarHuntSession session;
    private final float lockRadius;
    private final Listener listener;
    private float aimX = 650f;
    private float aimY = 650f;
    private float time;
    private float flash;

    public TelescopeHuntActor(Skin skin, float width, float height, int targetCount,
                              float lockRadius, Listener listener) {
        if (targetCount > STAR_X.length) throw new IllegalArgumentException("Too many telescope targets");
        pixel = ((TextureRegionDrawable) skin.getDrawable("white")).getRegion();
        session = new StarHuntSession(targetCount);
        this.lockRadius = lockRadius;
        this.listener = listener;
        setBounds(0f, 0f, width, height);
        addListener(new InputListener() {
            @Override public boolean touchDown(InputEvent event, float x, float y,
                                               int pointer, int button) {
                updateAim(x, y);
                return true;
            }

            @Override public void touchDragged(InputEvent event, float x, float y, int pointer) {
                updateAim(x, y);
            }
        });
    }

    @Override public void act(float delta) {
        super.act(delta);
        time += Math.min(delta, 1f / 20f);
        flash = Math.max(0f, flash - delta * 1.8f);
    }

    public boolean capture() {
        int nearest = nearestAvailableStar();
        if (nearest < 0) {
            flash = 0.28f;
            return false;
        }
        session.capture(nearest);
        flash = 1f;
        listener.onCapture(session.capturedCount(), session.targetCount());
        if (session.isComplete()) listener.onComplete();
        return true;
    }

    @Override public void draw(Batch batch, float parentAlpha) {
        Color old = new Color(batch.getColor());
        for (int i = 0; i < session.targetCount(); i++) drawStar(batch, i, parentAlpha);
        drawTelescope(batch, parentAlpha);
        drawSight(batch, parentAlpha);
        if (flash > 0f) {
            batch.setColor(0.55f, 0.92f, 1f, flash * 0.18f * parentAlpha);
            batch.draw(pixel, 0f, 0f, getWidth(), getHeight());
        }
        batch.setColor(old);
    }

    private void updateAim(float x, float y) {
        aimX = MathUtils.clamp(x, 130f, 1360f);
        aimY = MathUtils.clamp(y, 265f, 965f);
    }

    private int nearestAvailableStar() {
        int nearest = -1;
        float best = lockRadius * lockRadius;
        for (int i = 0; i < session.targetCount(); i++) {
            if (session.isCaptured(i)) continue;
            float dx = aimX - STAR_X[i];
            float dy = aimY - STAR_Y[i];
            float distance = dx * dx + dy * dy;
            if (distance <= best) {
                best = distance;
                nearest = i;
            }
        }
        return nearest;
    }

    private void drawStar(Batch batch, int index, float alpha) {
        float pulse = 1f + MathUtils.sin(time * 2.2f + index * 1.7f) * 0.10f;
        float x = STAR_X[index];
        float y = STAR_Y[index];
        if (session.isCaptured(index)) {
            batch.setColor(0.35f, 0.95f, 0.78f, 0.24f * alpha);
            drawCross(batch, x, y, 42f, 5f, 45f);
            return;
        }
        batch.setColor(index == 1 ? 1f : 0.50f, index == 1 ? 0.80f : 0.91f,
            index == 2 ? 0.66f : 1f, 0.95f * alpha);
        for (int ray = 0; ray < 8; ray++) {
            float angle = ray * 45f;
            float length = (ray % 2 == 0 ? 70f : 42f) * pulse;
            batch.draw(pixel, x, y - 3f, 0f, 3f, length, 6f, 1f, 1f, angle);
        }
        batch.setColor(1f, 1f, 0.90f, alpha);
        batch.draw(pixel, x - 11f, y - 11f, 22f, 22f);
    }

    private void drawTelescope(Batch batch, float alpha) {
        float baseX = 300f;
        float baseY = 120f;
        float angle = MathUtils.atan2(aimY - baseY, aimX - baseX) * MathUtils.radiansToDegrees;
        batch.setColor(0.08f, 0.12f, 0.30f, 0.96f * alpha);
        batch.draw(pixel, baseX - 18f, baseY - 20f, 18f, 20f, 390f, 76f, 1f, 1f, angle);
        batch.setColor(0.38f, 0.72f, 0.96f, alpha);
        batch.draw(pixel, baseX - 5f, baseY - 7f, 5f, 7f, 330f, 14f, 1f, 1f, angle);
        batch.setColor(0.18f, 0.25f, 0.52f, alpha);
        batch.draw(pixel, baseX - 32f, 30f, 64f, 130f);
        batch.draw(pixel, baseX - 120f, 30f, 28f, 145f);
        batch.draw(pixel, baseX + 92f, 30f, 28f, 145f);
    }

    private void drawSight(Batch batch, float alpha) {
        boolean locked = nearestAvailableStar() >= 0;
        if (locked) batch.setColor(0.48f, 1f, 0.76f, alpha);
        else batch.setColor(0.48f, 0.88f, 1f, 0.90f * alpha);
        drawCross(batch, aimX, aimY, locked ? 66f : 52f, 4f, 0f);
        float radius = locked ? 58f : 48f;
        for (int i = 0; i < 12; i++) {
            float angle = i * 30f + time * 14f;
            float x = aimX + MathUtils.cosDeg(angle) * radius;
            float y = aimY + MathUtils.sinDeg(angle) * radius;
            batch.draw(pixel, x - 6f, y - 2f, 12f, 4f);
        }
    }

    private void drawCross(Batch batch, float x, float y, float size, float thickness,
                           float rotation) {
        batch.draw(pixel, x - size, y - thickness * 0.5f, size, thickness * 0.5f,
            size * 2f, thickness, 1f, 1f, rotation);
        batch.draw(pixel, x - thickness * 0.5f, y - size, thickness * 0.5f, size,
            thickness, size * 2f, 1f, 1f, rotation);
    }
}
