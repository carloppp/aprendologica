package com.explorax.cazaestelar.network.config

data class AuthenticationEndpointConfig(
    val remoteEnabled: Boolean,
    val signInUrl: String
)

data class ProgressEndpointConfig(
    val remoteEnabled: Boolean,
    val syncUrl: String
)

data class NetworkServicesConfig(
    val developmentMode: Boolean,
    val authentication: AuthenticationEndpointConfig,
    val progress: ProgressEndpointConfig
)
