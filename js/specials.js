//js/specials.js
// Handle Multichrome Special Features
import { AudioEqualizer } from './equalizer.js';
import { sidePanelManager } from './side-panel.js';

export class SpecialsManager {
    constructor(player, ui) {
        this.player = player;
        this.ui = ui;
        this.dropdown = null;
        this.button = null;
        this.isOpen = false;
        this.equalizer = null;
        
        this.init();
    }

    init() {
        this.dropdown = document.getElementById('multichrome-specials-dropdown');
        this.button = document.getElementById('multichrome-specials-btn');
        
        if (!this.dropdown || !this.button) {
            console.warn('Multichrome Specials elements not found');
            return;
        }

        // Initialize equalizer
        this.equalizer = new AudioEqualizer(this.player.audio);

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
        const renderControls = (container) => {
            container.innerHTML = `
                <button id="close-equalizer-panel-btn" class="btn-icon" title="Close">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            `;

            container.querySelector('#close-equalizer-panel-btn').addEventListener('click', () => {
                sidePanelManager.close();
            });
        };

        const renderContent = async (container) => {
            // Initialize equalizer if not already initialized
            if (!this.equalizer.isInitialized) {
                try {
                    await this.equalizer.init();
                } catch (error) {
                    container.innerHTML = `
                        <div style="padding: 2rem; text-align: center; color: var(--muted-foreground);">
                            <p>Failed to initialize equalizer. Your browser may not support the Web Audio API.</p>
                        </div>
                    `;
                    return;
                }
            }

            const bands = this.equalizer.getBands();
            
            container.innerHTML = `
                <div class="equalizer-panel">
                    <div class="eq-presets">
                        <label style="font-size: 0.85rem; color: var(--muted-foreground); margin-bottom: 0.5rem; display: block;">Presets</label>
                        <select id="eq-preset-select" style="width: 100%; padding: 0.5rem; background: var(--secondary); border: 1px solid var(--border); border-radius: var(--radius); color: var(--foreground);">
                            <option value="">Custom</option>
                            <option value="flat">Flat</option>
                            <option value="bass-boost">Bass Boost</option>
                            <option value="treble-boost">Treble Boost</option>
                            <option value="vocal-boost">Vocal Boost</option>
                            <option value="rock">Rock</option>
                            <option value="pop">Pop</option>
                            <option value="jazz">Jazz</option>
                            <option value="classical">Classical</option>
                            <option value="electronic">Electronic</option>
                            <option value="hip-hop">Hip-Hop</option>
                        </select>
                    </div>
                    <div class="eq-controls">
                        ${bands.map((band, index) => `
                            <div class="eq-band">
                                <input 
                                    type="range" 
                                    id="eq-band-${index}" 
                                    min="-12" 
                                    max="12" 
                                    step="0.5" 
                                    value="${band.gain}" 
                                    orient="vertical"
                                    data-band="${index}"
                                />
                                <span class="eq-value">${band.gain.toFixed(1)}</span>
                                <span class="eq-label">${band.name}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="eq-actions">
                        <button id="eq-reset-btn" class="btn-secondary" style="flex: 1;">Reset</button>
                        <button id="eq-toggle-btn" class="btn-primary" style="flex: 1;">
                            ${this.equalizer.isEnabled ? 'Disable' : 'Enable'}
                        </button>
                    </div>
                </div>
            `;

            // Add event listeners
            const sliders = container.querySelectorAll('.eq-band input[type="range"]');
            sliders.forEach(slider => {
                const updateValue = () => {
                    const bandIndex = parseInt(slider.dataset.band);
                    const value = parseFloat(slider.value);
                    this.equalizer.setGain(bandIndex, value);
                    
                    const valueSpan = slider.parentElement.querySelector('.eq-value');
                    valueSpan.textContent = value.toFixed(1);
                    
                    // Reset preset selector
                    container.querySelector('#eq-preset-select').value = '';
                };

                slider.addEventListener('input', updateValue);
            });

            // Preset selector
            const presetSelect = container.querySelector('#eq-preset-select');
            presetSelect.addEventListener('change', (e) => {
                const preset = e.target.value;
                if (preset) {
                    this.equalizer.applyPreset(preset);
                    
                    // Update sliders
                    const gains = this.equalizer.getAllGains();
                    sliders.forEach((slider, index) => {
                        slider.value = gains[index];
                        const valueSpan = slider.parentElement.querySelector('.eq-value');
                        valueSpan.textContent = gains[index].toFixed(1);
                    });
                }
            });

            // Reset button
            container.querySelector('#eq-reset-btn').addEventListener('click', () => {
                this.equalizer.reset();
                sliders.forEach((slider) => {
                    slider.value = 0;
                    const valueSpan = slider.parentElement.querySelector('.eq-value');
                    valueSpan.textContent = '0.0';
                });
                presetSelect.value = 'flat';
            });

            // Toggle button
            const toggleBtn = container.querySelector('#eq-toggle-btn');
            toggleBtn.addEventListener('click', () => {
                const isEnabled = this.equalizer.toggle();
                toggleBtn.textContent = isEnabled ? 'Disable' : 'Enable';
                toggleBtn.className = isEnabled ? 'btn-secondary' : 'btn-primary';
            });
        };

        sidePanelManager.open('equalizer', 'Equalizer', renderControls, renderContent);
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
