//js/equalizer.js
// Audio Equalizer Implementation

export class AudioEqualizer {
    constructor(audioElement) {
        this.audioElement = audioElement;
        this.audioContext = null;
        this.sourceNode = null;
        this.gainNode = null;
        this.filters = [];
        this.isEnabled = false;
        this.isInitialized = false;

        // Default EQ settings
        this.bands = [
            { frequency: 60, gain: 0, q: 1.0, name: '60Hz' },
            { frequency: 170, gain: 0, q: 1.0, name: '170Hz' },
            { frequency: 310, gain: 0, q: 1.0, name: '310Hz' },
            { frequency: 600, gain: 0, q: 1.0, name: '600Hz' },
            { frequency: 1000, gain: 0, q: 1.0, name: '1kHz' },
            { frequency: 3000, gain: 0, q: 1.0, name: '3kHz' },
            { frequency: 6000, gain: 0, q: 1.0, name: '6kHz' },
            { frequency: 12000, gain: 0, q: 1.0, name: '12kHz' },
            { frequency: 14000, gain: 0, q: 1.0, name: '14kHz' },
            { frequency: 16000, gain: 0, q: 1.0, name: '16kHz' },
        ];

        this.loadSettings();
    }

    async init(sharedAudioContext = null, sharedSourceNode = null) {
        if (this.isInitialized) return;

        try {
            // Use shared context or create new one
            if (sharedAudioContext) {
                this.audioContext = sharedAudioContext;
                this.sourceNode = sharedSourceNode;
            } else {
                // Create audio context
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                this.audioContext = new AudioContext();

                // Create source node from audio element
                this.sourceNode = this.audioContext.createMediaElementSource(this.audioElement);
            }

            // Create gain node for overall volume
            this.gainNode = this.audioContext.createGain();

            // Create filter nodes for each band
            this.bands.forEach((band, index) => {
                const filter = this.audioContext.createBiquadFilter();
                filter.type = 'peaking';
                filter.frequency.value = band.frequency;
                filter.Q.value = band.q;
                filter.gain.value = band.gain;
                this.filters[index] = filter;
            });

            // Connect nodes: source -> filters -> gain -> destination
            // Only connect from source if we created it
            if (!sharedSourceNode) {
                this.sourceNode.connect(this.filters[0]);
            } else {
                // When using shared source, connection is managed externally
            }

            for (let i = 0; i < this.filters.length - 1; i++) {
                this.filters[i].connect(this.filters[i + 1]);
            }

            this.filters[this.filters.length - 1].connect(this.gainNode);
            // Don't auto-connect to destination when using shared context
            if (!sharedAudioContext) {
                this.gainNode.connect(this.audioContext.destination);
            }

            this.isInitialized = true;
            console.log('✓ Equalizer initialized');
        } catch (error) {
            console.error('Failed to initialize equalizer:', error);
            throw error;
        }
    }

    setGain(bandIndex, gain) {
        if (!this.isInitialized || !this.filters[bandIndex]) return;

        // Clamp gain between -12 and +12 dB
        const clampedGain = Math.max(-12, Math.min(12, gain));
        this.filters[bandIndex].gain.value = clampedGain;
        this.bands[bandIndex].gain = clampedGain;

        this.saveSettings();
    }

    setAllGains(gains) {
        if (!Array.isArray(gains) || gains.length !== this.bands.length) return;

        gains.forEach((gain, index) => {
            this.setGain(index, gain);
        });
    }

    reset() {
        this.bands.forEach((_, index) => {
            this.setGain(index, 0);
        });
    }

    applyPreset(presetName) {
        const presets = {
            flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            'bass-boost': [8, 6, 4, 2, 0, 0, 0, 0, 0, 0],
            'treble-boost': [0, 0, 0, 0, 0, 2, 4, 6, 8, 8],
            'vocal-boost': [0, 0, 2, 4, 6, 6, 4, 2, 0, 0],
            rock: [6, 4, 2, 0, -2, 0, 2, 4, 6, 6],
            pop: [2, 4, 6, 4, 0, 0, 2, 4, 6, 6],
            jazz: [4, 2, 0, 2, 4, 4, 2, 0, 2, 4],
            classical: [4, 2, 0, 0, 0, 0, 0, 2, 4, 6],
            electronic: [6, 4, 2, 0, 0, 2, 4, 6, 8, 8],
            'hip-hop': [8, 6, 4, 2, 0, 0, 2, 4, 6, 6],
        };

        const preset = presets[presetName];
        if (preset) {
            this.setAllGains(preset);
        }
    }

    getGain(bandIndex) {
        return this.bands[bandIndex]?.gain || 0;
    }

    getAllGains() {
        return this.bands.map((band) => band.gain);
    }

    getBands() {
        return this.bands;
    }

    getInputNode() {
        return this.isInitialized ? this.filters[0] : null;
    }

    getOutputNode() {
        return this.isInitialized ? this.gainNode : null;
    }

    saveSettings() {
        try {
            const settings = {
                enabled: this.isEnabled,
                gains: this.getAllGains(),
            };
            localStorage.setItem('equalizer-settings', JSON.stringify(settings));
        } catch (e) {
            console.warn('Failed to save equalizer settings:', e);
        }
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('equalizer-settings');
            if (saved) {
                const settings = JSON.parse(saved);
                this.isEnabled = settings.enabled || false;

                if (settings.gains && Array.isArray(settings.gains)) {
                    settings.gains.forEach((gain, index) => {
                        if (this.bands[index]) {
                            this.bands[index].gain = gain;
                        }
                    });
                }
            }
        } catch (e) {
            console.warn('Failed to load equalizer settings:', e);
        }
    }

    enable() {
        if (!this.isInitialized) {
            console.warn('Equalizer not initialized');
            return;
        }

        this.isEnabled = true;
        this.saveSettings();

        // Resume audio context if suspended
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    disable() {
        this.isEnabled = false;
        this.saveSettings();
    }

    toggle() {
        if (this.isEnabled) {
            this.disable();
        } else {
            this.enable();
        }
        return this.isEnabled;
    }
}
