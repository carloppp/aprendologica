package com.explorax.cazaestelar.content.validation

import com.explorax.cazaestelar.content.model.LocalizedText
import com.explorax.cazaestelar.content.model.ChoiceOption
import com.explorax.cazaestelar.content.model.MechanicDefinition
import com.explorax.cazaestelar.content.model.MissionDefinition
import com.explorax.cazaestelar.content.model.MultipleChoiceConfig
import com.explorax.cazaestelar.content.model.TelescopeHuntConfig
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class MissionValidatorTest {
    @Test
    fun `accepts the configured telescope mission`() {
        val mission = telescopeMission(TelescopeHuntConfig(3, 92f))
        assertTrue(MissionValidator.validate(mission, setOf("telescope_hunt")).isEmpty())
    }

    @Test
    fun `rejects telescope configuration outside supported limits`() {
        val mission = telescopeMission(TelescopeHuntConfig(9, 20f))
        assertEquals(2, MissionValidator.validate(mission, setOf("telescope_hunt")).size)
    }

    @Test
    fun `accepts one correct answer in multiple choice`() {
        val mission = multipleChoiceMission(
            listOf(
                ChoiceOption("a", LocalizedText("A"), false),
                ChoiceOption("b", LocalizedText("B"), true)
            )
        )
        assertTrue(MissionValidator.validate(mission, setOf("multiple_choice")).isEmpty())
    }

    @Test
    fun `rejects multiple correct answers`() {
        val mission = multipleChoiceMission(
            listOf(
                ChoiceOption("a", LocalizedText("A"), true),
                ChoiceOption("b", LocalizedText("B"), true)
            )
        )
        assertEquals(1, MissionValidator.validate(mission, setOf("multiple_choice")).size)
    }

    private fun telescopeMission(config: TelescopeHuntConfig) = MissionDefinition(
        id = "caza-estelar-01",
        version = 1,
        title = LocalizedText("Caza estelar"),
        instruction = LocalizedText("Captura las estrellas"),
        mechanic = MechanicDefinition("telescope_hunt", config),
        maximumStars = 3
    )

    private fun multipleChoiceMission(options: List<ChoiceOption>) = MissionDefinition(
        id = "seleccion-01",
        version = 1,
        title = LocalizedText("Selección"),
        instruction = LocalizedText("Elige una opción"),
        mechanic = MechanicDefinition(
            "multiple_choice",
            MultipleChoiceConfig(
                question = LocalizedText("¿Cuál es correcta?"),
                options = options,
                attempts = 2,
                successFeedback = LocalizedText("Correcto"),
                retryFeedback = LocalizedText("Intenta de nuevo")
            )
        ),
        maximumStars = 3
    )
}
