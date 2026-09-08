package com.explorax.cazaestelar.gameplay;

/** Small, platform-independent state model for the introductory telescope mission. */
public final class StarHuntSession {
    private final boolean[] captured;
    private int capturedCount;

    public StarHuntSession(int targetCount) {
        if (targetCount < 1) throw new IllegalArgumentException("targetCount must be positive");
        captured = new boolean[targetCount];
    }

    public int targetCount() {
        return captured.length;
    }

    public boolean capture(int starIndex) {
        if (starIndex < 0 || starIndex >= captured.length || captured[starIndex]) return false;
        captured[starIndex] = true;
        capturedCount++;
        return true;
    }

    public boolean isCaptured(int starIndex) {
        return starIndex >= 0 && starIndex < captured.length && captured[starIndex];
    }

    public int capturedCount() {
        return capturedCount;
    }

    public boolean isComplete() {
        return capturedCount == captured.length;
    }
}
