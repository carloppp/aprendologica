package com.explorax.cazaestelar.session;

public interface AuthenticationService {
    void signIn(String email, String password, AuthenticationCallback callback);

    PlayerSession restoreSession();

    void signOut();
}
