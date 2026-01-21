//js/crossfade.js
export class CrossfadeManager {
    constructor(player) {
        this.player = player;
        this.enabled = false;
        this.duration = 5; // Default 5 seconds
        this.fadeOutStarted = false;
        this.nextTrackPreloaded = false;

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
            this.fadeOutStarted = false;
            // Ensure audio is at full volume when starting
            if (!this.fadingIn) {
                this.player.audio.volume = this.player.userVolume;
            }
        });

        this.player.audio.addEventListener('ended', () => {
            this.fadeOutStarted = false;
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
        const audio = this.player.audio;
        const initialVolume = this.player.userVolume;

        // Calculate fade out
        const fadeSteps = 60; // 60 steps for smooth fade
        const fadeInterval = (this.duration * 1000) / fadeSteps;
        const volumeStep = initialVolume / fadeSteps;

        let step = 0;
        const fadeOutInterval = setInterval(() => {
            step++;
            const newVolume = Math.max(0, initialVolume - volumeStep * step);
            audio.volume = newVolume;

            if (step >= fadeSteps || audio.paused || audio.ended) {
                clearInterval(fadeOutInterval);
                // Trigger next track
                if (!audio.paused && !audio.ended) {
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
        const waitForNextTrack = setInterval(() => {
            if (this.player.currentTrack !== audio.dataset.trackId) {
                clearInterval(waitForNextTrack);
                this.fadeIn();
            }
        }, 100);

        // Clear after 10 seconds to avoid memory leak
        setTimeout(() => clearInterval(waitForNextTrack), 10000);
    }

    fadeIn() {
        this.fadingIn = true;
        const audio = this.player.audio;
        const targetVolume = this.player.userVolume;

        // Start from 0
        audio.volume = 0;

        const fadeSteps = 30;
        const fadeInterval = (this.duration * 1000) / fadeSteps;
        const volumeStep = targetVolume / fadeSteps;

        let step = 0;
        const fadeInInterval = setInterval(() => {
            step++;
            const newVolume = Math.min(targetVolume, volumeStep * step);
            audio.volume = newVolume;

            if (step >= fadeSteps || audio.paused) {
                clearInterval(fadeInInterval);
                audio.volume = targetVolume;
                this.fadingIn = false;
            }
        }, fadeInterval);
    }
}
