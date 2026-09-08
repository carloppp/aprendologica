package com.explorax.cazaestelar.session;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

final class AuthTokenTest {
    @Test void detectsTokenExpiration() {
        AuthToken token = new AuthToken("player", "Luna", "token", 100L);
        assertFalse(token.isExpired(99L));
        assertTrue(token.isExpired(100L));
    }

    @Test void inMemoryStoreCanClearTheSession() {
        InMemoryAuthTokenStore store = new InMemoryAuthTokenStore();
        store.save(new AuthToken("player", "Luna", "token", 100L));
        assertNotNull(store.load());
        store.clear();
        assertNull(store.load());
    }
}
