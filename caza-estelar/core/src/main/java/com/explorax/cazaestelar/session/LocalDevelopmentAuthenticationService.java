package com.explorax.cazaestelar.session;

import java.util.Locale;

/** Local-only access used when developmentMode is explicitly enabled. */
public final class LocalDevelopmentAuthenticationService implements AuthenticationService {
    @Override public void signIn(String email, String password, AuthenticationCallback callback) {
        String normalizedEmail = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
        if (!normalizedEmail.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
            callback.onComplete(AuthenticationResult.failure("Escribe un correo válido"));
            return;
        }
        if (password == null || password.length() < 4) {
            callback.onComplete(AuthenticationResult.failure("La clave debe tener al menos 4 caracteres"));
            return;
        }
        String name = normalizedEmail.substring(0, normalizedEmail.indexOf('@'));
        callback.onComplete(AuthenticationResult.success(new PlayerSession(normalizedEmail, name)));
    }

    @Override public void signOut() {
    }

    @Override public PlayerSession restoreSession() {
        return null;
    }
}
