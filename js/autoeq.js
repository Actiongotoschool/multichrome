//js/autoeq.js
// AutoEQ Integration for headphone equalization presets

export class AutoEQManager {
    constructor() {
        this.GITHUB_API_BASE = 'https://api.github.com/repos/jaakkopasanen/AutoEq/contents/results';
        this.GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/jaakkopasanen/AutoEq/master/results';
        this.cache = new Map();
        this.headphonesList = [];
        this.isLoading = false;
    }

    /**
     * Fetch list of available headphones from AutoEQ repository
     */
    async fetchHeadphonesList() {
        if (this.headphonesList.length > 0) {
            return this.headphonesList;
        }

        if (this.isLoading) {
            // Wait for existing load to complete
            return new Promise((resolve) => {
                const checkLoad = setInterval(() => {
                    if (!this.isLoading) {
                        clearInterval(checkLoad);
                        resolve(this.headphonesList);
                    }
                }, 100);
            });
        }

        this.isLoading = true;

        try {
            // Fetch the directory structure
            const response = await fetch(this.GITHUB_API_BASE);
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }

            // For now, we'll create a simplified list based on known popular models
            // In production, you'd want to recursively fetch all subdirectories from:
            // const data = await response.json();
            // const manufacturers = data.filter((item) => item.type === 'dir');
            const popularHeadphones = this.getPopularHeadphones();

            this.headphonesList = popularHeadphones;
            this.isLoading = false;

            return this.headphonesList;
        } catch (error) {
            console.error('Failed to fetch AutoEQ headphones list:', error);
            this.isLoading = false;
            // Return popular headphones as fallback
            return this.getPopularHeadphones();
        }
    }

    /**
     * Get a list of popular headphones with known AutoEQ presets
     */
    getPopularHeadphones() {
        return [
            { name: 'Sony WH-1000XM4', path: 'Sony/Sony WH-1000XM4' },
            { name: 'Sony WH-1000XM3', path: 'Sony/Sony WH-1000XM3' },
            { name: 'Sennheiser HD 650', path: 'Sennheiser/Sennheiser HD 650' },
            { name: 'Sennheiser HD 600', path: 'Sennheiser/Sennheiser HD 600' },
            { name: 'Sennheiser HD 560S', path: 'Sennheiser/Sennheiser HD 560S' },
            { name: 'Beyerdynamic DT 770 PRO', path: 'Beyerdynamic/Beyerdynamic DT 770 PRO' },
            { name: 'Beyerdynamic DT 990 PRO', path: 'Beyerdynamic/Beyerdynamic DT 990 PRO' },
            { name: 'Audio-Technica ATH-M50x', path: 'Audio-Technica/Audio-Technica ATH-M50x' },
            { name: 'Bose QuietComfort 35 II', path: 'Bose/Bose QuietComfort 35 II' },
            { name: 'AKG K702', path: 'AKG/AKG K702' },
            { name: 'Philips SHP9500', path: 'Philips/Philips SHP9500' },
            { name: 'HyperX Cloud Alpha', path: 'HyperX/HyperX Cloud Alpha' },
            { name: 'Apple AirPods Pro', path: 'Apple/Apple AirPods Pro' },
            { name: 'Beats Studio3 Wireless', path: 'Beats/Beats Studio3 Wireless' },
            { name: 'Focal Clear', path: 'Focal/Focal Clear' },
        ];
    }

    /**
     * Fetch AutoEQ preset for a specific headphone
     */
    async fetchPreset(headphonePath) {
        // Check cache first
        if (this.cache.has(headphonePath)) {
            return this.cache.get(headphonePath);
        }

        try {
            // Fetch the parametric EQ file
            const url = `${this.GITHUB_RAW_BASE}/${headphonePath}/parametric eq.txt`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Failed to fetch preset: ${response.status}`);
            }

            const text = await response.text();
            const preset = this.parseParametricEQ(text);

            // Cache the result
            this.cache.set(headphonePath, preset);

            return preset;
        } catch (error) {
            console.error(`Failed to fetch AutoEQ preset for ${headphonePath}:`, error);
            return null;
        }
    }

    /**
     * Parse parametric EQ text file
     */
    parseParametricEQ(text) {
        const lines = text.split('\n');
        const filters = [];

        for (const line of lines) {
            // Parse lines like: "Filter 1: ON PK Fc 105 Hz Gain -3.9 dB Q 0.70"
            const match = line.match(
                /Filter\s+\d+:\s+ON\s+(\w+)\s+Fc\s+([\d.]+)\s+Hz\s+Gain\s+([-\d.]+)\s+dB\s+Q\s+([\d.]+)/
            );

            if (match) {
                const [, type, frequency, gain, q] = match;
                filters.push({
                    type: type, // PK (peaking), LSQ (low shelf), HSQ (high shelf)
                    frequency: parseFloat(frequency),
                    gain: parseFloat(gain),
                    q: parseFloat(q),
                });
            }
        }

        return filters;
    }

    /**
     * Convert parametric EQ to 10-band graphic EQ gains
     */
    convertToGraphicEQ(parametricFilters, targetBands) {
        // Initialize gains array
        const gains = new Array(targetBands.length).fill(0);

        // For each target band, calculate the combined effect of all parametric filters
        targetBands.forEach((band, index) => {
            let totalGain = 0;

            parametricFilters.forEach((filter) => {
                // Calculate the gain contribution of this filter at the target frequency
                const gain = this.calculateFilterResponse(
                    filter.frequency,
                    filter.gain,
                    filter.q,
                    band.frequency,
                    filter.type
                );

                totalGain += gain;
            });

            // Clamp to -12dB to +12dB
            gains[index] = Math.max(-12, Math.min(12, totalGain));
        });

        return gains;
    }

    /**
     * Calculate the gain response of a parametric filter at a specific frequency
     */
    calculateFilterResponse(centerFreq, gain, q, targetFreq, type) {
        if (type === 'LSQ') {
            // Low shelf - affects frequencies below center
            if (targetFreq <= centerFreq) {
                return gain;
            }
            // Gradual rolloff above center frequency
            const ratio = Math.log(targetFreq / centerFreq) / Math.log(2);
            return gain * Math.exp((-ratio * ratio) / (2 * q * q));
        } else if (type === 'HSQ') {
            // High shelf - affects frequencies above center
            if (targetFreq >= centerFreq) {
                return gain;
            }
            // Gradual rolloff below center frequency
            const ratio = Math.log(centerFreq / targetFreq) / Math.log(2);
            return gain * Math.exp((-ratio * ratio) / (2 * q * q));
        } else {
            // Peaking filter (PK)
            const ratio = Math.log(targetFreq / centerFreq) / Math.log(2);
            const distance = (ratio * ratio) / (q * q);

            // Bell curve response
            return gain * Math.exp(-distance);
        }
    }

    /**
     * Search headphones by name
     */
    searchHeadphones(query) {
        const lowerQuery = query.toLowerCase();
        return this.headphonesList.filter((hp) => hp.name.toLowerCase().includes(lowerQuery));
    }

    /**
     * Get recommended headphones (most popular)
     */
    getRecommended() {
        return this.headphonesList.slice(0, 10);
    }
}
