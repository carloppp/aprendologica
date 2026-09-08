package com.explorax.cazaestelar.session;

public record AuthenticationResult(boolean successful, String message, PlayerSession session) {
    public static AuthenticationResult success(PlayerSession session) {
        return new AuthenticationResult(true, "", session);
    }

    public static AuthenticationResult failure(String message) {
        return new AuthenticationResult(false, message, null);
    }
}
