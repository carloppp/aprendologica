package com.explorax.cazaestelar.mechanics

class MechanicRegistry(types: Set<String>) {
    private val supportedTypes = types.toSet()

    fun supports(type: String): Boolean = type in supportedTypes

    fun supportedTypes(): Set<String> = supportedTypes

    companion object {
        @JvmStatic
        fun defaultRegistry() = MechanicRegistry(setOf("telescope_hunt", "multiple_choice"))
    }
}
