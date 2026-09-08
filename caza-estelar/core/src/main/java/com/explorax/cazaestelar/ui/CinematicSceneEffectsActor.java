package com.explorax.cazaestelar.ui;

import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.graphics.GL20;
import com.badlogic.gdx.graphics.Pixmap;
import com.badlogic.gdx.graphics.Texture;
import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.math.MathUtils;
import com.badlogic.gdx.scenes.scene2d.Actor;
import com.badlogic.gdx.scenes.scene2d.Touchable;

/** Subtle animated light pass over an already composed illustration. */
public final class CinematicSceneEffectsActor extends Actor {
    public enum Scene { LOGIN, MENU }

    private static final float[][] LOGIN_LIGHTS = {
        {816f, 1004f, 150f, 0f}, {996f, 850f, 185f, 2f},
        {1197f, 704f, 170f, 0f}, {149f, 239f, 125f, 1f},
        {1051f, 314f, 135f, 1f}, {1248f, 270f, 145f, 0f}
    };
    private static final float[][] MENU_LIGHTS = {
        {181f, 902f, 120f, 0f}, {470f, 822f, 135f, 1f},
        {774f, 981f, 135f, 2f}, {1003f, 884f, 145f, 3f},
        {531f, 604f, 190f, 0f}, {930f, 574f, 115f, 3f},
        {1140f, 567f, 110f, 0f}, {367f, 244f, 115f, 0f},
        {650f, 202f, 125f, 1f}, {963f, 206f, 135f, 3f}
    };
    private static final Color[] COLORS = {
        new Color(0.34f, 0.88f, 1f, 1f),
        new Color(0.43f, 1f, 0.58f, 1f),
        new Color(0.78f, 0.55f, 1f, 1f),
        new Color(1f, 0.72f, 0.28f, 1f)
    };

    private static Texture softGlow;
    private final Scene scene;
    private float time;

    public CinematicSceneEffectsActor(float width, float height, Scene scene) {
        ensureSoftGlow();
        this.scene = scene;
        setBounds(0f, 0f, width, height);
        setTouchable(Touchable.disabled);
    }

    @Override public void act(float delta) {
        super.act(delta);
        time += Math.min(delta, 1f / 20f);
    }

    @Override public void draw(Batch batch, float parentAlpha) {
        Color previous = new Color(batch.getColor());
        int previousSrc = batch.getBlendSrcFunc();
        int previousDst = batch.getBlendDstFunc();
        float alpha = parentAlpha * getColor().a;
        batch.setBlendFunction(GL20.GL_SRC_ALPHA, GL20.GL_ONE);

        float[][] lights = scene == Scene.LOGIN ? LOGIN_LIGHTS : MENU_LIGHTS;
        for (int i = 0; i < lights.length; i++) {
            float[] light = lights[i];
            float pulse = 0.5f + 0.5f * MathUtils.sin(time * (0.72f + i * 0.035f) + i * 1.37f);
            drawGlow(batch, light[0], light[1], light[2], COLORS[(int) light[3]], pulse, alpha);
        }

        batch.setBlendFunction(previousSrc, previousDst);
        batch.setColor(previous);
    }

    private void drawGlow(Batch batch, float x, float y, float radius,
                          Color color, float pulse, float alpha) {
        float size = radius * (0.94f + pulse * 0.08f);
        batch.setColor(color.r, color.g, color.b, alpha * (0.025f + pulse * 0.055f));
        batch.draw(softGlow, x - size, y - size, size * 2f, size * 2f);
    }

    private static void ensureSoftGlow() {
        if (softGlow != null) return;
        int size = 128;
        Pixmap pixmap = new Pixmap(size, size, Pixmap.Format.RGBA8888);
        float center = (size - 1) * 0.5f;
        for (int y = 0; y < size; y++) {
            for (int x = 0; x < size; x++) {
                float dx = (x - center) / center;
                float dy = (y - center) / center;
                float distance = MathUtils.clamp((float) Math.sqrt(dx * dx + dy * dy), 0f, 1f);
                float opacity = (1f - distance);
                opacity *= opacity * (3f - 2f * opacity);
                pixmap.setColor(1f, 1f, 1f, opacity);
                pixmap.drawPixel(x, y);
            }
        }
        softGlow = new Texture(pixmap);
        softGlow.setFilter(Texture.TextureFilter.Linear, Texture.TextureFilter.Linear);
        pixmap.dispose();
    }

    public static void disposeSharedResources() {
        if (softGlow != null) {
            softGlow.dispose();
            softGlow = null;
        }
    }
}
