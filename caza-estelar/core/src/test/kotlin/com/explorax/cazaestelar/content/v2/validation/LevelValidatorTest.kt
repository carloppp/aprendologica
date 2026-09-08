package com.explorax.cazaestelar.content.v2.validation

import com.explorax.cazaestelar.content.model.ChoiceOption
import com.explorax.cazaestelar.content.model.LocalizedText
import com.explorax.cazaestelar.content.model.MechanicDefinition
import com.explorax.cazaestelar.content.model.MultipleChoiceConfig
import com.explorax.cazaestelar.content.model.TelescopeHuntConfig
import com.explorax.cazaestelar.content.v2.model.LevelCompletion
import com.explorax.cazaestelar.content.v2.model.LevelDefinition
import com.explorax.cazaestelar.content.v2.model.LevelUnlock
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class LevelValidatorTest {

    private val installed = setOf("telescope_hunt", "multiple_choice")

    private fun base(
        mechanic: MechanicDefinition = MechanicDefinition("telescope_hunt", TelescopeHuntConfig(3, 92f)),
        completion: LevelCompletion = LevelCompletion.MinimumScore(60),
        unlock: LevelUnlock = LevelUnlock()
    ) = LevelDefinition(
        id = "nivel",
        version = 1,
        order = 1,
        title = LocalizedText("Nivel", "Level"),
        instruction = LocalizedText("Instrucción", "Instruction"),
        mechanic = mechanic,
        unlock = unlock,
        completion = completion
    )

    private fun fields(level: LevelDefinition) =
        LevelValidator.validate(level, installed).map { it.field }

    @Test
    fun `accepts a valid telescope level`() {
        assertEquals(emptyList<String>(), fields(base()))
    }

    @Test
    fun `rejects completion score out of range`() {
        assertTrue("completion.value" in fields(base(completion = LevelCompletion.MinimumScore(140))))
    }

    @Test
    fun `rejects self prerequisite and duplicates`() {
        val level = base(unlock = LevelUnlock(listOf("nivel", "otro", "otro")))
        val issues = fields(level)
        assertEquals(2, issues.count { it == "unlock.prerequisiteLevelIds" })
    }

    @Test
    fun `rejects uninstalled mechanic`() {
        assertTrue("mechanic.type" in fields(base(mechanic = MechanicDefinition("matching", TelescopeHuntConfig(3, 92f)))))
    }

    @Test
    fun `validates multiple choice rules`() {
        val bad = MultipleChoiceConfig(
            question = LocalizedText(""),
            options = listOf(
                ChoiceOption("a", LocalizedText("A"), correct = true),
                ChoiceOption("a", LocalizedText("B"), correct = true)
            ),
            attempts = 9,
            successFeedback = LocalizedText("ok"),
            retryFeedback = LocalizedText("retry")
        )
        val issues = fields(base(mechanic = MechanicDefinition("multiple_choice", bad)))
        assertTrue("mechanic.config.question.es" in issues)
        assertTrue("mechanic.config.options.id" in issues)
        assertTrue("mechanic.config.options.correct" in issues)
        assertTrue("mechanic.config.attempts" in issues)
    }
}
