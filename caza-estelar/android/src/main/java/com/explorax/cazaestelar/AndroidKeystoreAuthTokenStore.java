package com.explorax.cazaestelar;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;

import com.explorax.cazaestelar.session.AuthToken;
import com.explorax.cazaestelar.session.AuthTokenStore;

import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import org.json.JSONObject;

/** Stores only the short-lived access token, encrypted by Android Keystore. */
public final class AndroidKeystoreAuthTokenStore implements AuthTokenStore {
    private static final String KEY_ALIAS = "caza_estelar_session_key_v1";
    private static final String PREFS = "caza-estelar-secure-session-v1";
    private static final String IV_KEY = "token.iv";
    private static final String DATA_KEY = "token.data";
    private final SharedPreferences preferences;

    public AndroidKeystoreAuthTokenStore(Context context) {
        preferences = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    @Override public AuthToken load() {
        String ivValue = preferences.getString(IV_KEY, null);
        String dataValue = preferences.getString(DATA_KEY, null);
        if (ivValue == null || dataValue == null) return null;
        try {
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(
                Cipher.DECRYPT_MODE, getOrCreateKey(),
                new GCMParameterSpec(128, Base64.decode(ivValue, Base64.NO_WRAP))
            );
            String payload = new String(
                cipher.doFinal(Base64.decode(dataValue, Base64.NO_WRAP)), StandardCharsets.UTF_8
            );
            JSONObject fields = new JSONObject(payload);
            return new AuthToken(
                fields.getString("playerId"), fields.getString("displayName"),
                fields.getString("accessToken"), fields.getLong("expiresAtEpochSeconds")
            );
        } catch (Exception exception) {
            clear();
            return null;
        }
    }

    @Override public void save(AuthToken token) {
        try {
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, getOrCreateKey());
            String payload = new JSONObject()
                .put("playerId", token.playerId())
                .put("displayName", token.displayName())
                .put("accessToken", token.accessToken())
                .put("expiresAtEpochSeconds", token.expiresAtEpochSeconds())
                .toString();
            byte[] encrypted = cipher.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            preferences.edit()
                .putString(IV_KEY, Base64.encodeToString(cipher.getIV(), Base64.NO_WRAP))
                .putString(DATA_KEY, Base64.encodeToString(encrypted, Base64.NO_WRAP))
                .apply();
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to store secure session", exception);
        }
    }

    @Override public void clear() {
        preferences.edit().remove(IV_KEY).remove(DATA_KEY).apply();
    }

    private SecretKey getOrCreateKey() throws Exception {
        KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
        keyStore.load(null);
        if (keyStore.containsAlias(KEY_ALIAS)) {
            return ((KeyStore.SecretKeyEntry) keyStore.getEntry(KEY_ALIAS, null)).getSecretKey();
        }
        KeyGenerator generator = KeyGenerator.getInstance(
            KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore"
        );
        generator.init(new KeyGenParameterSpec.Builder(
            KEY_ALIAS, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT
        ).setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .build());
        return generator.generateKey();
    }
}
