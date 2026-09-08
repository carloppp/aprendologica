package com.explorax.cazaestelar.session;

@FunctionalInterface
public interface AuthenticationCallback {
    void onComplete(AuthenticationResult result);
}
