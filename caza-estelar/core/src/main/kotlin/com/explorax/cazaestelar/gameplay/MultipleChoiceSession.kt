package com.explorax.cazaestelar.gameplay

data class ChoiceAnswerResult(
    val correct: Boolean,
    val attemptsRemaining: Int,
    val starsEarned: Int,
    val finished: Boolean
)

class MultipleChoiceSession(
    private val correctOptionId: String,
    private val maximumAttempts: Int,
    private val maximumStars: Int
) {
    var attemptsRemaining: Int = maximumAttempts
        private set

    var finished: Boolean = false
        private set

    fun submit(optionId: String): ChoiceAnswerResult {
        check(!finished) { "The activity has already finished" }
        if (optionId == correctOptionId) {
            finished = true
            val errors = maximumAttempts - attemptsRemaining
            return ChoiceAnswerResult(true, attemptsRemaining, maxOf(1, maximumStars - errors), true)
        }

        attemptsRemaining--
        finished = attemptsRemaining == 0
        return ChoiceAnswerResult(false, attemptsRemaining, 0, finished)
    }
}
