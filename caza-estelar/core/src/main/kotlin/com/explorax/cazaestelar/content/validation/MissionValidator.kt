package com.explorax.cazaestelar.content.validation

import com.explorax.cazaestelar.content.model.MissionDefinition
import com.explorax.cazaestelar.content.model.MultipleChoiceConfig
import com.explorax.cazaestelar.content.model.TelescopeHuntConfig

data class ValidationIssue(val field: String, val message: String)

object MissionValidator {
    fun validate(mission: MissionDefinition, supportedMechanics: Set<String>): List<ValidationIssue> {
        val issues = mutableListOf<ValidationIssue>()
        if (mission.id.isBlank()) issues += ValidationIssue("id", "La misión necesita un identificador")
        if (mission.version < 1) issues += ValidationIssue("version", "La versión debe ser mayor que cero")
        if (mission.title.es.isBlank()) issues += ValidationIssue("title.es", "Falta el título en español")
        if (mission.instruction.es.isBlank()) issues += ValidationIssue("instruction.es", "Falta la instrucción")
        if (mission.maximumStars !in 1..3) issues += ValidationIssue("rewards.maximumStars", "La recompensa debe estar entre 1 y 3 estrellas")
        if (mission.id in mission.prerequisiteMissionIds) issues += ValidationIssue("unlock.prerequisiteMissionIds", "Una misión no puede depender de sí misma")
        if (mission.prerequisiteMissionIds.distinct().size != mission.prerequisiteMissionIds.size) issues += ValidationIssue("unlock.prerequisiteMissionIds", "Los prerrequisitos no pueden repetirse")
        if (mission.mechanic.type !in supportedMechanics) issues += ValidationIssue("mechanic.type", "La mecánica no está instalada en esta versión")
        when (mission.mechanic.type) {
            "telescope_hunt" -> {
                val config = mission.mechanic.config as? TelescopeHuntConfig
                if (config == null) {
                    issues += ValidationIssue("mechanic.config", "La configuración del telescopio tiene un formato incorrecto")
                } else {
                    if (config.targetCount !in 1..6) issues += ValidationIssue("mechanic.config.targetCount", "El telescopio admite entre 1 y 6 objetivos")
                    if (config.lockRadius !in 40f..180f) issues += ValidationIssue("mechanic.config.lockRadius", "El radio de captura debe estar entre 40 y 180")
                }
            }
            "multiple_choice" -> {
                val config = mission.mechanic.config as? MultipleChoiceConfig
                if (config == null) {
                    issues += ValidationIssue("mechanic.config", "La selección múltiple tiene un formato incorrecto")
                } else {
                    if (config.question.es.isBlank()) issues += ValidationIssue("mechanic.config.question.es", "Falta la pregunta")
                    if (config.options.size !in 2..6) issues += ValidationIssue("mechanic.config.options", "Debe haber entre 2 y 6 opciones")
                    if (config.options.map { it.id }.distinct().size != config.options.size) issues += ValidationIssue("mechanic.config.options.id", "Los identificadores de opción deben ser únicos")
                    if (config.options.count { it.correct } != 1) issues += ValidationIssue("mechanic.config.options.correct", "Debe existir exactamente una respuesta correcta")
                    if (config.options.any { it.text.es.isBlank() }) issues += ValidationIssue("mechanic.config.options.text.es", "Todas las opciones necesitan texto")
                    if (config.attempts !in 1..5) issues += ValidationIssue("mechanic.config.attempts", "Los intentos deben estar entre 1 y 5")
                    if (config.successFeedback.es.isBlank()) issues += ValidationIssue("mechanic.config.successFeedback.es", "Falta la retroalimentación de éxito")
                    if (config.retryFeedback.es.isBlank()) issues += ValidationIssue("mechanic.config.retryFeedback.es", "Falta la retroalimentación de reintento")
                }
            }
        }
        return issues
    }
}
