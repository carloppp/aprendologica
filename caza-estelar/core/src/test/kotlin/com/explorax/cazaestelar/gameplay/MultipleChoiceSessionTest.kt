package com.explorax.cazaestelar.gameplay

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class MultipleChoiceSessionTest {
    @Test
    fun `awards maximum stars on the first attempt`() {
        val session = MultipleChoiceSession("correct", 2, 3)
        val result = session.submit("correct")
        assertTrue(result.correct)
        assertTrue(result.finished)
        assertEquals(3, result.starsEarned)
    }

    @Test
    fun `reduces reward after an incorrect attempt`() {
        val session = MultipleChoiceSession("correct", 2, 3)
        assertFalse(session.submit("wrong").finished)
        val result = session.submit("correct")
        assertEquals(2, result.starsEarned)
    }

    @Test
    fun `finishes without stars when attempts are exhausted`() {
        val session = MultipleChoiceSession("correct", 2, 3)
        session.submit("wrong-1")
        val result = session.submit("wrong-2")
        assertTrue(result.finished)
        assertFalse(result.correct)
        assertEquals(0, result.starsEarned)
    }
}
