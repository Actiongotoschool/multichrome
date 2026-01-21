//js/crossfade.js
export class CrossfadeManager {
    constructor(player) {
        this.player = player;
        this.enabled = false;
        this.duration = 5; // Default 5 seconds
        this.fadeOutStarted = false;
        this.nextTrackPreloaded = false;
        this.volumeMultiplier = 1.0; // For crossfade volume control
        this.currentTrackId = null;

        // Storage keys
        this.ENABLED_KEY = 'crossfade-enabled';
        this.DURATION_KEY = 'crossfade-duration';

        // Load settings
        this.loadSettings();
    }

    loadSettings() {
        try {
            const enabled = localStorage.getItem(this.ENABLED_KEY);
            this.enabled = enabled === 'true';

            const duration = localStorage.getItem(this.DURATION_KEY);
            if (duration) {
                this.duration = parseInt(duration, 10);
            }
        } catch (error) {
            console.error('Failed to load crossfade settings:', error);
        }
    }

    saveSettings() {
        try {
            localStorage.setItem(this.ENABLED_KEY, this.enabled ? 'true' : 'false');
            localStorage.setItem(this.DURATION_KEY, this.duration.toString());
        } catch (error) {
            console.error('Failed to save crossfade settings:', error);
        }
    }

    isEnabled() {
        return this.enabled;
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        this.saveSettings();
    }

    getDuration() {
        return this.duration;
    }

    setDuration(duration) {
        this.duration = Math.max(1, Math.min(12, duration));
        this.saveSettings();
    }

    init() {
        // Listen to timeupdate to trigger crossfade
        this.player.audio.addEventListener('timeupdate', () => {
            this.handleTimeUpdate();
        });

        // Reset fade state when track changes
        this.player.audio.addEventListener('play', () => {
            const newTrackId = this.player.currentTrack?.id;
            if (newTrackId !== this.currentTrackId) {
                this.currentTrackId = newTrackId;
                this.fadeOutStarted = false;
                this.nextTrackPreloaded = false;
            }
            // Ensure volume multiplier is reset when starting
            if (!this.fadingIn) {
                this.volumeMultiplier = 1.0;
                this.player.applyReplayGain();
            }
        });

        this.player.audio.addEventListener('ended', () => {
            this.fadeOutStarted = false;
            this.nextTrackPreloaded = false;
        });
    }

    handleTimeUpdate() {
        if (!this.enabled || this.fadeOutStarted) return;

        const audio = this.player.audio;
        const timeRemaining = audio.duration - audio.currentTime;

        // Start crossfade when time remaining equals crossfade duration
        if (timeRemaining > 0 && timeRemaining <= this.duration && !audio.paused) {
            this.startCrossfade();
        }
    }

    async startCrossfade() {
        this.fadeOutStarted = true;

        // Calculate fade out
        const fadeSteps = 60; // 60 steps for smooth fade
        const fadeInterval = (this.duration * 1000) / fadeSteps;

        let step = 0;
        const fadeOutInterval = setInterval(() => {
            step++;
            this.volumeMultiplier = Math.max(0, 1.0 - step / fadeSteps);
            this.player.applyReplayGain();

            if (step >= fadeSteps || this.player.audio.paused || this.player.audio.ended) {
                clearInterval(fadeOutInterval);
                // Trigger next track
                if (!this.player.audio.paused && !this.player.audio.ended) {
                    this.player.playNext();
                }
            }
        }, fadeInterval);

        // Preload next track if not already done
        if (!this.nextTrackPreloaded) {
            await this.player.preloadNextTracks();
            this.nextTrackPreloaded = true;
        }

        // Wait for next track to start, then fade in
        const originalTrackId = this.currentTrackId;
        const waitForNextTrack = setInterval(() => {
            if (this.currentTrackId !== originalTrackId) {
                clearInterval(waitForNextTrack);
                this.fadeIn();
            }
        }, 100);

        // Clear after 10 seconds to avoid memory leak
        setTimeout(() => clearInterval(waitForNextTrack), 10000);
    }

    fadeIn() {
        this.fadingIn = true;

        // Start from 0
        this.volumeMultiplier = 0;
        this.player.applyReplayGain();

        const fadeSteps = 30;
        const fadeInterval = (this.duration * 1000) / fadeSteps;

        let step = 0;
        const fadeInInterval = setInterval(() => {
            step++;
            this.volumeMultiplier = Math.min(1.0, step / fadeSteps);
            this.player.applyReplayGain();

            if (step >= fadeSteps || this.player.audio.paused) {
                clearInterval(fadeInInterval);
                this.volumeMultiplier = 1.0;
                this.player.applyReplayGain();
                this.fadingIn = false;
            }
        }, fadeInterval);
    }
}
