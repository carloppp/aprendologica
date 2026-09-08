package com.explorax.cazaestelar.navigation;

import com.badlogic.gdx.Game;
import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.Screen;
import com.badlogic.gdx.assets.AssetManager;
import com.badlogic.gdx.files.FileHandle;
import com.explorax.cazaestelar.content.ContentRefreshStatus;
import com.explorax.cazaestelar.content.ContentService;
import com.explorax.cazaestelar.content.RefreshableContentService;
import com.explorax.cazaestelar.content.model.ConstellationDefinition;
import com.explorax.cazaestelar.content.model.ContentCatalog;
import com.explorax.cazaestelar.content.model.MissionDefinition;
import com.explorax.cazaestelar.content.model.ThemeDefinition;
import com.explorax.cazaestelar.content.validation.CatalogValidator;
import com.explorax.cazaestelar.content.validation.MissionValidator;
import com.explorax.cazaestelar.diagnostics.AppDiagnostics;
import com.explorax.cazaestelar.mechanics.MechanicRegistry;
import com.explorax.cazaestelar.media.RemoteMediaManager;
import com.explorax.cazaestelar.progress.MissionProgress;
import com.explorax.cazaestelar.progress.MissionUnlockPolicy;
import com.explorax.cazaestelar.progress.ProgressRepository;
import com.explorax.cazaestelar.progress.sync.SyncingProgressRepository;
import com.explorax.cazaestelar.screens.ConstellationMapScreen;
import com.explorax.cazaestelar.screens.LoadingScreen;
import com.explorax.cazaestelar.screens.LoginScreen;
import com.explorax.cazaestelar.screens.MainMenuScreen;
import com.explorax.cazaestelar.screens.MissionListScreen;
import com.explorax.cazaestelar.screens.MultipleChoiceScreen;
import com.explorax.cazaestelar.screens.RecoveryScreen;
import com.explorax.cazaestelar.screens.TelescopeHuntScreen;
import com.explorax.cazaestelar.screens.ThemeMapScreen;
import com.explorax.cazaestelar.session.AuthenticationCallback;
import com.explorax.cazaestelar.session.AuthenticationResult;
import com.explorax.cazaestelar.session.AuthenticationService;
import com.explorax.cazaestelar.session.PlayerSession;
import com.explorax.cazaestelar.settings.AppSettings;
import com.explorax.cazaestelar.ui.UiResources;
import java.util.HashSet;
import java.util.Set;
import java.util.function.Supplier;

public final class GameNavigator {
    private final Game game;
    private final AssetManager assets;
    private final UiResources ui;
    private final AuthenticationService authentication;
    private final AppSettings settings;
    private ContentCatalog catalog;
    private final ContentService contentService;
    private final MechanicRegistry mechanics;
    private final ProgressRepository progress;
    private final RemoteMediaManager media;
    private final AppDiagnostics diagnostics;

    public GameNavigator(Game game, AssetManager assets, UiResources ui,
                         AuthenticationService authentication, AppSettings settings,
                         ContentService contentService, MechanicRegistry mechanics,
                         ProgressRepository progress, RemoteMediaManager media,
                         AppDiagnostics diagnostics) {
        this.game = game;
        this.assets = assets;
        this.ui = ui;
        this.authentication = authentication;
        this.settings = settings;
        this.mechanics = mechanics;
        this.contentService = contentService;
        this.catalog = contentService.loadPublishedCatalog();
        if (!CatalogValidator.INSTANCE.validate(catalog).isEmpty()) {
            throw new IllegalStateException("El catálogo publicado contiene una progresión inválida");
        }
        this.progress = progress;
        this.media = media;
        this.diagnostics = diagnostics;
        this.media.setCatalog(catalog);
    }

    public void showLoading() {
        openSafely(() -> new LoadingScreen(this, assets, ui, settings));
    }

    public void showLogin() {
        openSafely(() -> new LoginScreen(this, ui, assets, settings));
    }

    public void showEntry() {
        try {
            PlayerSession restored = authentication.restoreSession();
            if (restored == null) showLogin();
            else showMainMenu(restored);
        } catch (RuntimeException error) {
            diagnostics.error("session_restore_failed");
            showRecovery();
        }
    }

    public void showMainMenu(PlayerSession session) {
        synchronizeProgress();
        openSafely(() -> new MainMenuScreen(this, ui, assets, session, settings));
    }

    public void signIn(String email, String password, AuthenticationCallback callback) {
        try {
            authentication.signIn(email, password, result -> Gdx.app.postRunnable(() -> {
                try {
                    if (result.successful()) synchronizeProgress();
                    callback.onComplete(result);
                } catch (RuntimeException error) {
                    diagnostics.error("sign_in_callback_failed");
                    showRecovery();
                }
            }));
        } catch (RuntimeException error) {
            diagnostics.error("sign_in_request_failed");
            callback.onComplete(AuthenticationResult.failure(
                "No fue posible iniciar sesión. Inténtalo nuevamente."
            ));
        }
    }

    public void showConstellations(PlayerSession session) {
        openSafely(() -> new ConstellationMapScreen(
            this, ui, assets, session, settings, catalog
        ));
    }

    public void refreshAndShowConstellations(PlayerSession session) {
        if (!(contentService instanceof RefreshableContentService refreshable)) {
            showConstellations(session);
            return;
        }
        try {
            refreshable.refresh(result -> Gdx.app.postRunnable(() -> {
                try {
                    recordRefreshStatus(result.getStatus());
                    catalog = result.getCatalog();
                    media.setCatalog(catalog);
                    showConstellations(session);
                } catch (RuntimeException error) {
                    diagnostics.error("content_refresh_apply_failed");
                    showRecovery();
                }
            }));
        } catch (RuntimeException error) {
            diagnostics.error("content_refresh_request_failed");
            showRecovery();
        }
    }

    public void showThemes(PlayerSession session, ConstellationDefinition constellation) {
        openSafely(() -> new ThemeMapScreen(
            this, ui, assets, session, settings, constellation
        ));
    }

    public void showMissions(PlayerSession session, ConstellationDefinition constellation,
                             ThemeDefinition theme) {
        openSafely(() -> new MissionListScreen(
            this, ui, assets, session, settings, constellation, theme
        ));
    }

    public boolean isMissionPlayable(MissionDefinition mission) {
        return MissionValidator.INSTANCE.validate(mission, mechanics.supportedTypes()).isEmpty();
    }

    public MissionProgress missionProgress(PlayerSession session, MissionDefinition mission) {
        return progress.find(session.playerId(), mission.getId());
    }

    public FileHandle cachedMedia(String assetId) {
        return media.findCached(assetId);
    }

    public MissionProgress recordMissionResult(PlayerSession session, MissionDefinition mission,
                                                int starsEarned) {
        return progress.recordResult(
            session.playerId(), mission.getId(), mission.getVersion(), starsEarned
        );
    }

    public boolean isMissionUnlocked(PlayerSession session, MissionDefinition mission) {
        Set<String> completed = new HashSet<>();
        for (String prerequisiteId : mission.getPrerequisiteMissionIds()) {
            MissionProgress prerequisite = progress.find(session.playerId(), prerequisiteId);
            if (prerequisite != null && prerequisite.getCompleted()) completed.add(prerequisiteId);
        }
        return MissionUnlockPolicy.INSTANCE.isUnlocked(mission, completed);
    }

    public void showMission(PlayerSession session, MissionDefinition mission) {
        if (!isMissionPlayable(mission)) {
            diagnostics.warning("mission_validation_rejected");
            showRecovery();
            return;
        }
        try {
            media.ensureMissionMedia(
                mission, () -> Gdx.app.postRunnable(() -> openMission(session, mission))
            );
        } catch (RuntimeException error) {
            diagnostics.error("mission_media_prepare_failed");
            showRecovery();
        }
    }

    private void openMission(PlayerSession session, MissionDefinition mission) {
        if ("telescope_hunt".equals(mission.getMechanic().getType())) {
            openSafely(() -> new TelescopeHuntScreen(
                this, ui, assets, session, settings, mission
            ));
            return;
        }
        if ("multiple_choice".equals(mission.getMechanic().getType())) {
            openSafely(() -> new MultipleChoiceScreen(
                this, ui, assets, session, settings, mission
            ));
            return;
        }
        diagnostics.warning("unsupported_mechanic_requested");
        showRecovery();
    }

    public void showMissionListFor(PlayerSession session, MissionDefinition selectedMission) {
        for (ConstellationDefinition constellation : catalog.getConstellations()) {
            for (ThemeDefinition theme : constellation.getThemes()) {
                for (MissionDefinition mission : theme.getMissions()) {
                    if (mission.getId().equals(selectedMission.getId())) {
                        showMissions(session, constellation, theme);
                        return;
                    }
                }
            }
        }
        showConstellations(session);
    }

    public void signOut() {
        try {
            authentication.signOut();
        } catch (RuntimeException error) {
            diagnostics.error("sign_out_failed");
        } finally {
            showLogin();
        }
    }

    public void showRecovery() {
        if (game.getScreen() instanceof RecoveryScreen) return;
        diagnostics.error("recovery_screen_opened");
        try {
            switchTo(new RecoveryScreen(this, ui, settings));
        } catch (RuntimeException recoveryError) {
            diagnostics.error("recovery_screen_failed");
        }
    }

    private void synchronizeProgress() {
        if (!(progress instanceof SyncingProgressRepository syncing)) return;
        try {
            syncing.synchronize();
        } catch (RuntimeException error) {
            diagnostics.warning("progress_sync_request_failed");
        }
    }

    private void recordRefreshStatus(ContentRefreshStatus status) {
        switch (status) {
            case UPDATED -> diagnostics.info("content_refresh_updated");
            case UP_TO_DATE -> diagnostics.info("content_refresh_up_to_date");
            case OFFLINE -> diagnostics.warning("content_refresh_offline");
            case REJECTED -> diagnostics.warning("content_refresh_rejected");
        }
    }

    private void openSafely(Supplier<Screen> screenFactory) {
        try {
            switchTo(screenFactory.get());
        } catch (RuntimeException error) {
            diagnostics.error("screen_navigation_failed");
            showRecovery();
        }
    }

    private void switchTo(Screen next) {
        Screen previous = game.getScreen();
        boolean installed = false;
        try {
            game.setScreen(next);
            installed = true;
        } finally {
            if (!installed) next.dispose();
        }
        if (previous != null && previous != next) previous.dispose();
    }
}
