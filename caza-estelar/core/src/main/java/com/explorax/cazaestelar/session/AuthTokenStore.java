package com.explorax.cazaestelar.session;

public interface AuthTokenStore {
    AuthToken load();
    void save(AuthToken token);
    void clear();
}
