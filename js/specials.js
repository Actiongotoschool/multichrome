//js/specials.js
// Handle Multichrome Special Features
import { AudioEqualizer } from './equalizer.js';
import { sidePanelManager } from './side-panel.js';
import { ListeningStats } from './listening-stats.js';
import { AutoEQManager } from './autoeq.js';

export class SpecialsManager {
    constructor(player, ui) {
        this.player = player;
        this.ui = ui;
        this.dropdown = null;
        this.button = null;
        this.isOpen = false;
        this.equalizer = null;
        this.listeningStats = null;
        this.autoEQ = null;
        
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

        // Initialize listening stats
        this.listeningStats = new ListeningStats();
        this.setupStatsTracking();

        // Initialize AutoEQ
        this.autoEQ = new AutoEQManager();

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

    setupStatsTracking() {
        const audio = this.player.audio;

        // Start tracking on play
        audio.addEventListener('play', () => {
            if (this.player.currentTrack) {
                this.listeningStats.startTracking(this.player.currentTrack);
            }
        });

        // Pause tracking
        audio.addEventListener('pause', () => {
            this.listeningStats.pauseTracking();
        });

        // Stop tracking on track end
        audio.addEventListener('ended', () => {
            this.listeningStats.stopTracking();
        });

        // Update tracking when track changes
        const originalPlay = this.player.play.bind(this.player);
        this.player.play = (track) => {
            this.listeningStats.stopTracking();
            const result = originalPlay(track);
            if (track) {
                this.listeningStats.startTracking(track);
            }
            return result;
        };
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
                        <select id="eq-preset-select" style="width: 100%; padding: 0.5rem; background: var(--secondary); border: 1px solid var(--border); border-radius: var(--radius); color: var(--foreground); margin-bottom: 0.5rem;">
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
                        <button id="autoeq-btn" class="btn-secondary" style="width: 100%; margin-bottom: 0.5rem;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 0.5rem; vertical-align: middle;">
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                                <line x1="12" y1="22.08" x2="12" y2="12"></line>
                            </svg>
                            AutoEQ Headphone Presets
                        </button>
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

            // AutoEQ button
            const autoEQBtn = container.querySelector('#autoeq-btn');
            autoEQBtn.addEventListener('click', () => {
                this.openAutoEQSelector(container, sliders, presetSelect);
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
        this.showFeatureNotImplemented(
            'Crossfade',
            'Crossfade will enable smooth transitions between tracks with configurable overlap duration.',
            [
                'Adjustable crossfade duration (1-12 seconds)',
                'Fade in/out curves',
                'Smart crossfade (analyzes track endings)',
                'Enable/disable per session'
            ]
        );
    }

    openVisualizer() {
        this.showFeatureNotImplemented(
            'Full-Screen Visualizer',
            'An immersive audio-reactive visualizer will display beautiful animations synchronized to your music.',
            [
                'Multiple visualization styles',
                'Beat detection and bass response',
                'Color themes matching album art',
                'Fullscreen mode'
            ]
        );
    }

    showFeatureNotImplemented(title, description, features) {
        const featuresHTML = features ? `
            <div style="margin-top: 1rem;">
                <strong style="display: block; margin-bottom: 0.5rem; color: var(--foreground);">Planned features:</strong>
                <ul style="margin: 0; padding-left: 1.5rem; color: var(--muted-foreground);">
                    ${features.map(f => `<li style="margin: 0.25rem 0;">${f}</li>`).join('')}
                </ul>
            </div>
        ` : '';

        const content = `
            <div style="padding: 1rem;">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
                    <div style="width: 60px; height: 60px; background: var(--secondary); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M12 16v-4"></path>
                            <path d="M12 8h.01"></path>
                        </svg>
                    </div>
                    <div style="text-align: center;">
                        <h3 style="margin: 0 0 0.5rem 0;">Feature Coming Soon</h3>
                        <p style="color: var(--muted-foreground); margin: 0;">${description}</p>
                    </div>
                </div>
                ${featuresHTML}
                <div style="margin-top: 1.5rem; padding: 1rem; background: var(--secondary); border-radius: var(--radius); border-left: 3px solid var(--primary);">
                    <p style="margin: 0; font-size: 0.85rem; color: var(--muted-foreground);">
                        <strong style="color: var(--foreground);">Stay tuned!</strong> This feature is under development and will be available in a future update.
                    </p>
                </div>
            </div>
        `;

        this.showModal(title, content);
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

    openListeningStats() {
        const renderControls = (container) => {
            container.innerHTML = `
                <button id="close-stats-panel-btn" class="btn-icon" title="Close">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            `;

            container.querySelector('#close-stats-panel-btn').addEventListener('click', () => {
                sidePanelManager.close();
            });
        };

        const renderContent = (container) => {
            const totalStats = this.listeningStats.getTotalStats();
            const topTracks = this.listeningStats.getTopTracks(10);
            const topArtists = this.listeningStats.getTopArtists(5);

            container.innerHTML = `
                <div class="stats-panel">
                    <div class="stats-summary">
                        <h4>Your Music Journey</h4>
                        <div class="stats-grid">
                            <div class="stat-card">
                                <span class="stat-value">${totalStats.totalPlays}</span>
                                <span class="stat-label">Total Plays</span>
                            </div>
                            <div class="stat-card">
                                <span class="stat-value">${this.listeningStats.formatTime(totalStats.totalListenTime)}</span>
                                <span class="stat-label">Listen Time</span>
                            </div>
                            <div class="stat-card">
                                <span class="stat-value">${totalStats.totalTracks}</span>
                                <span class="stat-label">Unique Tracks</span>
                            </div>
                            <div class="stat-card">
                                <span class="stat-value">${totalStats.totalArtists}</span>
                                <span class="stat-label">Artists</span>
                            </div>
                        </div>
                    </div>

                    <div class="stats-section">
                        <h4>Top Tracks</h4>
                        ${topTracks.length > 0 ? `
                            <div class="stats-list">
                                ${topTracks.map((track, index) => `
                                    <div class="stats-item">
                                        <span class="stats-rank">${index + 1}</span>
                                        <div class="stats-info">
                                            <div class="stats-title">${track.title}</div>
                                            <div class="stats-subtitle">${track.artist}</div>
                                        </div>
                                        <div class="stats-meta">
                                            <span>${track.count} plays</span>
                                            <span class="stats-time">${this.listeningStats.formatTime(track.totalTime)}</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : '<p style="text-align: center; color: var(--muted-foreground); padding: 2rem;">No listening history yet. Start playing some music!</p>'}
                    </div>

                    <div class="stats-section">
                        <h4>Top Artists</h4>
                        ${topArtists.length > 0 ? `
                            <div class="stats-list">
                                ${topArtists.map((artist, index) => `
                                    <div class="stats-item">
                                        <span class="stats-rank">${index + 1}</span>
                                        <div class="stats-info">
                                            <div class="stats-title">${artist.name}</div>
                                        </div>
                                        <div class="stats-meta">
                                            <span>${artist.count} plays</span>
                                            <span class="stats-time">${this.listeningStats.formatTime(artist.totalTime)}</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : '<p style="text-align: center; color: var(--muted-foreground); padding: 2rem;">No artist data yet.</p>'}
                    </div>

                    <div class="stats-footer">
                        <button id="clear-stats-btn" class="btn-secondary" style="width: 100%;">Clear All Statistics</button>
                    </div>
                </div>
            `;

            // Clear stats button
            container.querySelector('#clear-stats-btn').addEventListener('click', () => {
                if (confirm('Are you sure you want to clear all listening statistics? This cannot be undone.')) {
                    this.listeningStats.clearStats();
                    renderContent(container);
                }
            });
        };

        sidePanelManager.open('stats', 'Listening Statistics', renderControls, renderContent);
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

    openAutoEQSelector(parentContainer, sliders, presetSelect) {
        // Create AutoEQ overlay
        const overlay = document.createElement('div');
        overlay.className = 'autoeq-overlay';
        overlay.innerHTML = `
            <div class="autoeq-modal">
                <div class="autoeq-header">
                    <h3>AutoEQ Headphone Presets</h3>
                    <button class="close-autoeq-btn">&times;</button>
                </div>
                <div class="autoeq-content">
                    <div class="autoeq-search">
                        <input 
                            type="text" 
                            id="autoeq-search" 
                            placeholder="Search headphones (e.g., Sony WH-1000XM4)..."
                            style="width: 100%; padding: 0.75rem; background: var(--secondary); border: 1px solid var(--border); border-radius: var(--radius); color: var(--foreground);"
                        />
                    </div>
                    <div class="autoeq-info">
                        <p style="font-size: 0.85rem; color: var(--muted-foreground); margin: 0.75rem 0;">
                            These presets are from the <a href="https://github.com/jaakkopasanen/AutoEq" target="_blank" style="color: var(--primary);">AutoEQ project</a>, 
                            which provides automatic headphone equalization to match a neutral target curve.
                        </p>
                    </div>
                    <div class="autoeq-list" id="autoeq-list">
                        <div style="text-align: center; padding: 2rem; color: var(--muted-foreground);">
                            Loading headphones...
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Close button
        const closeBtn = overlay.querySelector('.close-autoeq-btn');
        closeBtn.addEventListener('click', () => overlay.remove());

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });

        // Load and display headphones
        this.loadAutoEQHeadphones(overlay, parentContainer, sliders, presetSelect);
    }

    async loadAutoEQHeadphones(overlay, parentContainer, sliders, presetSelect) {
        const listElement = overlay.querySelector('#autoeq-list');
        const searchInput = overlay.querySelector('#autoeq-search');

        try {
            // Fetch headphones list
            const headphones = await this.autoEQ.fetchHeadphonesList();

            const renderList = (filteredHeadphones) => {
                if (filteredHeadphones.length === 0) {
                    listElement.innerHTML = `
                        <div style="text-align: center; padding: 2rem; color: var(--muted-foreground);">
                            No headphones found. Try a different search term.
                        </div>
                    `;
                    return;
                }

                listElement.innerHTML = filteredHeadphones.map(hp => `
                    <button class="autoeq-item" data-path="${hp.path}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                            <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
                        </svg>
                        <span>${hp.name}</span>
                    </button>
                `).join('');

                // Add click handlers
                listElement.querySelectorAll('.autoeq-item').forEach(btn => {
                    btn.addEventListener('click', async () => {
                        await this.applyAutoEQPreset(btn.dataset.path, parentContainer, sliders, presetSelect);
                        overlay.remove();
                    });
                });
            };

            // Initial render
            renderList(headphones);

            // Search functionality
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value;
                if (query.length === 0) {
                    renderList(headphones);
                } else {
                    const filtered = this.autoEQ.searchHeadphones(query);
                    renderList(filtered);
                }
            });

        } catch (error) {
            listElement.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--muted-foreground);">
                    <p>Failed to load AutoEQ presets.</p>
                    <p style="font-size: 0.85rem; margin-top: 0.5rem;">Error: ${error.message}</p>
                </div>
            `;
        }
    }

    async applyAutoEQPreset(headphonePath, parentContainer, sliders, presetSelect) {
        // Show loading state
        const loadingOverlay = document.createElement('div');
        loadingOverlay.style.cssText = 'position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; border-radius: var(--radius);';
        loadingOverlay.innerHTML = '<div style="color: var(--foreground); text-align: center;"><div style="margin-bottom: 0.5rem;">Loading preset...</div><div style="font-size: 0.85rem; color: var(--muted-foreground);">Please wait</div></div>';
        parentContainer.style.position = 'relative';
        parentContainer.appendChild(loadingOverlay);

        try {
            // Fetch the preset from AutoEQ
            const parametricFilters = await this.autoEQ.fetchPreset(headphonePath);

            if (!parametricFilters || parametricFilters.length === 0) {
                throw new Error('No filters found in preset');
            }

            // Convert to our 10-band EQ
            const bands = this.equalizer.getBands();
            const gains = this.autoEQ.convertToGraphicEQ(parametricFilters, bands);

            // Apply the gains
            this.equalizer.setAllGains(gains);

            // Update UI sliders
            sliders.forEach((slider, index) => {
                slider.value = gains[index];
                const valueSpan = slider.parentElement.querySelector('.eq-value');
                valueSpan.textContent = gains[index].toFixed(1);
            });

            // Update preset selector
            presetSelect.value = '';

            // Show success message
            loadingOverlay.innerHTML = '<div style="color: var(--primary); text-align: center;"><div style="margin-bottom: 0.5rem;">✓ Preset Applied!</div><div style="font-size: 0.85rem;">AutoEQ tuning loaded</div></div>';
            
            setTimeout(() => {
                loadingOverlay.remove();
            }, 1500);

        } catch (error) {
            console.error('Failed to apply AutoEQ preset:', error);
            loadingOverlay.innerHTML = `<div style="color: #ef4444; text-align: center;"><div style="margin-bottom: 0.5rem;">✗ Failed to Load</div><div style="font-size: 0.85rem;">${error.message}</div></div>`;
            
            setTimeout(() => {
                loadingOverlay.remove();
            }, 3000);
        }
    }
}
