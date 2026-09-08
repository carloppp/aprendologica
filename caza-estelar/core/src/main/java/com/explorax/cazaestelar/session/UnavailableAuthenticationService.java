package com.explorax.cazaestelar.session;

/** Safe failure used when a production build has no valid authentication endpoint. */
public final class UnavailableAuthenticationService implements AuthenticationService {
    private static final String MESSAGE =
        "El acceso no está disponible. Revisa la configuración del servicio.";

    @Override public void signIn(String email, String password, AuthenticationCallback callback) {
        callback.onComplete(AuthenticationResult.failure(MESSAGE));
    }

    @Override public PlayerSession restoreSession() {
        return null;
    }

    @Override public void signOut() {
    }
}
