package com.explorax.cazaestelar.diagnostics;

/** Records fixed event codes only, preventing credentials or tokens from reaching logs. */
public interface AppDiagnostics {
    void info(String eventCode);

    void warning(String eventCode);

    void error(String eventCode);
}
