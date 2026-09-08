package com.explorax.cazaestelar.network

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class JsonEncodingTest {
    @Test
    fun `escapes credentials and identifiers as JSON strings`() {
        assertEquals("\"a\\\"b\\\\c\\n\"", JsonEncoding.quote("a\"b\\c\n"))
    }
}
