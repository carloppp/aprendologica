package com.explorax.cazaestelar.diagnostics;

public final class NoOpAppDiagnostics implements AppDiagnostics {
    @Override public void info(String eventCode) {
    }

    @Override public void warning(String eventCode) {
    }

    @Override public void error(String eventCode) {
    }
}
