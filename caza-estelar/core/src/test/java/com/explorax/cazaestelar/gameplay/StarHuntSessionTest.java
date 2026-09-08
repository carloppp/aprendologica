package com.explorax.cazaestelar.gameplay;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Test;

final class StarHuntSessionTest {
    @Test void requiresThreeDifferentStarsToComplete() {
        StarHuntSession session = new StarHuntSession(3);
        assertTrue(session.capture(0));
        assertFalse(session.capture(0));
        assertTrue(session.capture(1));
        assertFalse(session.isComplete());
        assertTrue(session.capture(2));
        assertTrue(session.isComplete());
        assertEquals(3, session.capturedCount());
    }

    @Test void supportsAConfiguredTargetCount() {
        StarHuntSession session = new StarHuntSession(2);
        assertEquals(2, session.targetCount());
        assertTrue(session.capture(0));
        assertFalse(session.isComplete());
        assertTrue(session.capture(1));
        assertTrue(session.isComplete());
        assertFalse(session.capture(2));
    }
}
