//js/specials.js
// Handle Multichrome Special Features

export class SpecialsManager {
    constructor(player, ui) {
        this.player = player;
        this.ui = ui;
        this.dropdown = null;
        this.button = null;
        this.isOpen = false;
        
        this.init();
    }

    init() {
        this.dropdown = document.getElementById('multichrome-specials-dropdown');
        this.button = document.getElementById('multichrome-specials-btn');
        
        if (!this.dropdown || !this.button) {
            console.warn('Multichrome Specials elements not found');
            return;
        }

        // Toggle dropdown
        this.button.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });

        // Close button
        const closeBtn = this.dropdown.querySelector('.close-specials-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.dropdown.contains(e.target) && e.target !== this.button) {
                this.close();
            }
        });

        // Handle feature buttons
        const featureButtons = this.dropdown.querySelectorAll('.special-item:not(:disabled)');
        featureButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const feature = btn.dataset.feature;
                this.openFeature(feature);
            });
        });
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        this.dropdown.classList.add('show');
        this.button.classList.add('active');
        this.isOpen = true;
    }

    close() {
        this.dropdown.classList.remove('show');
        this.button.classList.remove('active');
        this.isOpen = false;
    }

    openFeature(feature) {
        console.log(`Opening feature: ${feature}`);
        this.close();
        
        switch(feature) {
            case 'equalizer':
                this.openEqualizer();
                break;
            case 'crossfade':
                this.openCrossfade();
                break;
            case 'audio-stats':
                this.openAudioStats();
                break;
            case 'visualizer':
                this.openVisualizer();
                break;
            case 'stats':
                this.openListeningStats();
                break;
            default:
                console.warn(`Feature not implemented: ${feature}`);
        }
    }

    openEqualizer() {
        // TODO: Implement equalizer
        alert('Equalizer feature coming soon! This will allow you to adjust frequency bands for customized sound.');
    }

    openCrossfade() {
        // TODO: Implement crossfade settings
        alert('Crossfade feature coming soon! This will enable smooth transitions between tracks.');
    }

    openAudioStats() {
        if (!this.player.currentTrack) {
            alert('No track currently playing');
            return;
        }

        const audio = this.player.audio;
        const track = this.player.currentTrack;
        
        // Get audio stats
        const sampleRate = audio.sampleRate || 'N/A';
        const duration = track.duration ? this.formatTime(track.duration) : 'N/A';
        const quality = track.audioQuality || 'Unknown';
        const bitDepth = track.bitDepth || 'N/A';
        const codec = track.codec || 'N/A';
        
        const statsHTML = `
            <div style="padding: 1rem;">
                <h3 style="margin-bottom: 1rem;">Current Audio Stats</h3>
                <div style="display: grid; gap: 0.75rem;">
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--muted-foreground);">Quality:</span>
                        <span style="font-weight: 600;">${quality}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--muted-foreground);">Duration:</span>
                        <span style="font-weight: 600;">${duration}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--muted-foreground);">Sample Rate:</span>
                        <span style="font-weight: 600;">${sampleRate} Hz</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--muted-foreground);">Bit Depth:</span>
                        <span style="font-weight: 600;">${bitDepth} bit</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--muted-foreground);">Codec:</span>
                        <span style="font-weight: 600;">${codec}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--muted-foreground);">Current Time:</span>
                        <span style="font-weight: 600;">${this.formatTime(audio.currentTime)}</span>
                    </div>
                </div>
            </div>
        `;

        // Create modal
        this.showModal('Audio Statistics', statsHTML);
    }

    openVisualizer() {
        // TODO: Implement full-screen visualizer
        alert('Full-screen Visualizer coming soon! This will display audio-reactive animations.');
    }

    openListeningStats() {
        // TODO: Implement listening statistics
        alert('Listening Statistics coming soon! This will show your play history, top tracks, and more.');
    }

    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    showModal(title, content) {
        // Create a simple modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content" style="max-width: 400px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h3 style="margin: 0;">${title}</h3>
                    <button class="close-modal-btn" style="background: none; border: none; font-size: 24px; cursor: pointer; color: var(--muted-foreground);">&times;</button>
                </div>
                ${content}
            </div>
        `;

        document.body.appendChild(modal);

        const closeBtn = modal.querySelector('.close-modal-btn');
        const overlay = modal.querySelector('.modal-overlay');

        const closeModal = () => {
            modal.remove();
        };

        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', closeModal);
    }
}
