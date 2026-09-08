package com.explorax.cazaestelar.content.cache

import java.security.MessageDigest

object CatalogIntegrity {
    fun sha256(value: String): String = sha256(value.toByteArray(Charsets.UTF_8))

    fun sha256(value: ByteArray): String = MessageDigest.getInstance("SHA-256")
        .digest(value)
        .joinToString("") { "%02x".format(it.toInt() and 0xff) }
}
