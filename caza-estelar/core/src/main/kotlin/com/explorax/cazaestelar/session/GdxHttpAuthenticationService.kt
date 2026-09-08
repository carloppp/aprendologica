package com.explorax.cazaestelar.session

import com.badlogic.gdx.Gdx
import com.badlogic.gdx.Net
import com.badlogic.gdx.utils.JsonReader
import com.explorax.cazaestelar.network.JsonEncoding

class GdxHttpAuthenticationService(
    private val signInUrl: String,
    private val tokenStore: AuthTokenStore
) : AuthenticationService {
    init {
        require(signInUrl.startsWith("https://")) { "Authentication URL must use HTTPS" }
    }

    override fun signIn(email: String?, password: String?, callback: AuthenticationCallback) {
        val request = Net.HttpRequest(Net.HttpMethods.POST).apply {
            url = signInUrl
            timeOut = 10_000
            setHeader("Content-Type", "application/json")
            content = "{\"email\":${JsonEncoding.quote(email.orEmpty().trim())}," +
                "\"password\":${JsonEncoding.quote(password.orEmpty())}}"
        }
        Gdx.net.sendHttpRequest(request, object : Net.HttpResponseListener {
            override fun handleHttpResponse(response: Net.HttpResponse) {
                val status = response.status.statusCode
                if (status !in 200..299) {
                    val message = if (status == 401 || status == 403) {
                        "Credenciales incorrectas"
                    } else "El servicio de acceso no está disponible"
                    callback.onComplete(AuthenticationResult.failure(message))
                    return
                }
                val rawResponse = response.resultAsString
                if (rawResponse.toByteArray(Charsets.UTF_8).size > 65_536) {
                    callback.onComplete(AuthenticationResult.failure("Respuesta de acceso inválida"))
                    return
                }
                val result = runCatching {
                    val root = JsonReader().parse(rawResponse)
                    val user = root.get("user")
                    val session = PlayerSession(user.getString("id"), user.getString("displayName"))
                    val token = AuthToken(
                        session.playerId(), session.displayName(), root.getString("accessToken"),
                        root.getLong("expiresAtEpochSeconds")
                    )
                    require(session.playerId().isNotBlank() && session.displayName().isNotBlank())
                    require(session.displayName().length <= 100)
                    require(token.accessToken().isNotBlank() && token.accessToken().length <= 8_192)
                    require(!token.isExpired(System.currentTimeMillis() / 1000L))
                    tokenStore.save(token)
                    AuthenticationResult.success(session)
                }.getOrElse { AuthenticationResult.failure("Respuesta de acceso inválida") }
                callback.onComplete(result)
            }

            override fun failed(cause: Throwable) {
                callback.onComplete(AuthenticationResult.failure("No se pudo conectar con el servidor"))
            }

            override fun cancelled() {
                callback.onComplete(AuthenticationResult.failure("Acceso cancelado"))
            }
        })
    }

    override fun signOut() {
        tokenStore.clear()
    }

    override fun restoreSession(): PlayerSession? {
        val token = tokenStore.load() ?: return null
        if (token.isExpired(System.currentTimeMillis() / 1000L)) {
            tokenStore.clear()
            return null
        }
        return PlayerSession(token.playerId(), token.displayName())
    }
}
