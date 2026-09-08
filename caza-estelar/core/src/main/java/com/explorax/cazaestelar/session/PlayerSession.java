package com.explorax.cazaestelar.session;

import java.util.Locale;

public record PlayerSession(String playerId, String displayName) {
    public PlayerSession(String displayName) {
        this(localId(displayName), displayName);
    }

    private static String localId(String displayName) {
        String normalized = displayName == null ? "explorador"
            : displayName.trim().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9_-]", "-");
        return normalized.isBlank() ? "explorador" : normalized;
    }
}
