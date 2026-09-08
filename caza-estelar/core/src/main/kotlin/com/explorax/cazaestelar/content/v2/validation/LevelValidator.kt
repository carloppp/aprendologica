package com.explorax.cazaestelar.content.v2.validation

import com.explorax.cazaestelar.content.model.MultipleChoiceConfig
import com.explorax.cazaestelar.content.model.TelescopeHuntConfig
import com.explorax.cazaestelar.content.validation.ValidationIssue
import com.explorax.cazaestelar.content.v2.model.LevelCompletion
import com.explorax.cazaestelar.content.v2.model.LevelDefinition

/**
 * Valida un [LevelDefinition] contra las reglas del contrato v2 y las mecánicas instaladas.
 * Reemplaza a `MissionValidator`. Ver `docs/CONTENT_SCHEMA_V2.md`.
 */
object LevelValidator {

    fun validate(level: LevelDefinition, supportedMechanics: Set<String>): List<ValidationIssue> {
        val issues = mutableListOf<ValidationIssue>()
        if (level.id.isBlank()) issues += ValidationIssue("id", "El nivel necesita un identificador")
        if (level.version < 1) issues += ValidationIssue("version", "La versión debe ser mayor que cero")
        if (level.title.es.isBlank()) issues += ValidationIssue("title.es", "Falta el título en español")
        if (level.instruction.es.isBlank()) issues += ValidationIssue("instruction.es", "Falta la instrucción")

        when (val completion = level.completion) {
            is LevelCompletion.MinimumScore ->
                if (completion.value !in 0..100) {
                    issues += ValidationIssue("completion.value", "El puntaje mínimo debe estar entre 0 y 100")
                }
        }
        if (level.reward.experience < 0) {
            issues += ValidationIssue("reward.experience", "La experiencia no puede ser negativa")
        }

        val prerequisites = level.unlock.prerequisiteLevelIds
        if (level.id in prerequisites) {
            issues += ValidationIssue("unlock.prerequisiteLevelIds", "Un nivel no puede depender de sí mismo")
        }
        if (prerequisites.distinct().size != prerequisites.size) {
            issues += ValidationIssue("unlock.prerequisiteLevelIds", "Los prerrequisitos no pueden repetirse")
        }

        if (level.mechanic.type !in supportedMechanics) {
            issues += ValidationIssue("mechanic.type", "La mecánica no está instalada en esta versión")
        }
        when (level.mechanic.type) {
            "telescope_hunt" -> {
                val config = level.mechanic.config as? TelescopeHuntConfig
                if (config == null) {
                    issues += ValidationIssue("mechanic.config", "La configuración del telescopio tiene un formato incorrecto")
                } else {
                    if (config.targetCount !in 1..6) issues += ValidationIssue("mechanic.config.targetCount", "El telescopio admite entre 1 y 6 objetivos")
                    if (config.lockRadius !in 40f..180f) issues += ValidationIssue("mechanic.config.lockRadius", "El radio de captura debe estar entre 40 y 180")
                }
            }
            "multiple_choice" -> {
                val config = level.mechanic.config as? MultipleChoiceConfig
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
