package com.explorax.cazaestelar.session;

public record AuthToken(String playerId, String displayName, String accessToken,
                        long expiresAtEpochSeconds) {
    public boolean isExpired(long nowEpochSeconds) {
        return expiresAtEpochSeconds <= nowEpochSeconds;
    }
}
