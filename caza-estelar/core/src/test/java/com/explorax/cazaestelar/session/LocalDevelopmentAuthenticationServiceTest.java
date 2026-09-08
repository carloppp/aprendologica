package com.explorax.cazaestelar.session;

import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LocalDevelopmentAuthenticationServiceTest {
    private final LocalDevelopmentAuthenticationService service =
        new LocalDevelopmentAuthenticationService();

    @Test
    void acceptsAValidLocalLoginWithoutPersistingCredentials() {
        AuthenticationResult result = signIn("Luna@example.com", "1234");
        assertTrue(result.successful());
        assertEquals("luna", result.session().displayName());
        assertEquals("luna@example.com", result.session().playerId());
        assertNull(service.restoreSession());
    }

    @Test
    void rejectsInvalidEmailAndShortPassword() {
        assertFalse(signIn("invalid", "1234").successful());
        assertFalse(signIn("luna@example.com", "123").successful());
    }

    private AuthenticationResult signIn(String email, String password) {
        AtomicReference<AuthenticationResult> result = new AtomicReference<>();
        service.signIn(email, password, result::set);
        return result.get();
    }
}
