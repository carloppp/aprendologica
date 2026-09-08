package com.explorax.cazaestelar.session;

public final class InMemoryAuthTokenStore implements AuthTokenStore {
    private AuthToken token;

    @Override public AuthToken load() {
        return token;
    }

    @Override public void save(AuthToken token) {
        this.token = token;
    }

    @Override public void clear() {
        token = null;
    }
}
