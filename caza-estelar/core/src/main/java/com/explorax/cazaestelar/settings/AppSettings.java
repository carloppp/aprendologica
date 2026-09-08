package com.explorax.cazaestelar.settings;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.Preferences;

/** Preferences shared by every screen and persisted between launches. */
public final class AppSettings {
    public enum Language { SPANISH, ENGLISH }

    private static final String PREFERENCES_NAME = "caza-estelar-settings";
    private final Preferences preferences;
    private Language language;
    private boolean soundEnabled;

    public AppSettings() {
        preferences = Gdx.app.getPreferences(PREFERENCES_NAME);
        language = "en".equals(preferences.getString("language", "es"))
            ? Language.ENGLISH : Language.SPANISH;
        soundEnabled = preferences.getBoolean("sound", true);
    }

    public Language language() {
        return language;
    }

    public boolean isEnglish() {
        return language == Language.ENGLISH;
    }

    public void setLanguage(Language language) {
        this.language = language;
        preferences.putString("language", language == Language.ENGLISH ? "en" : "es").flush();
    }

    public boolean soundEnabled() {
        return soundEnabled;
    }

    public void toggleSound() {
        soundEnabled = !soundEnabled;
        preferences.putBoolean("sound", soundEnabled).flush();
    }

    public String text(String spanish, String english) {
        return isEnglish() ? english : spanish;
    }
}
