//js/visualizer.js
export class Visualizer {
    constructor(audioElement) {
        this.audio = audioElement;
        this.isActive = false;
        this.animationId = null;
        this.canvas = null;
        this.canvasCtx = null;
        this.analyser = null;
        this.audioContext = null;
        this.source = null;
        this.inputNode = null; // For shared audio graph
        this.dataArray = null;
        this.bufferLength = null;
        this.visualizationStyle = 'bars'; // 'bars', 'waveform', 'circular'
        this.colors = {
            primary: '#ffffff',
            secondary: '#888888',
            accent: '#ff0000',
        };
    }

    async init(sharedAudioContext = null, connectFromNode = null) {
        if (this.audioContext) return;

        try {
            if (sharedAudioContext) {
                // Use shared context
                this.audioContext = sharedAudioContext;
            } else {
                // Create audio context
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            // Create analyser node
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;
            this.bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(this.bufferLength);

            // Connect audio element to analyser
            if (connectFromNode) {
                // Connect from provided node (e.g., equalizer output)
                this.inputNode = connectFromNode;
                connectFromNode.connect(this.analyser);
            } else if (!this.source) {
                // Create our own source
                this.source = this.audioContext.createMediaElementSource(this.audio);
                this.source.connect(this.analyser);
                this.analyser.connect(this.audioContext.destination);
            }
        } catch (error) {
            console.error('Failed to initialize visualizer:', error);
            throw error;
        }
    }

    setStyle(style) {
        this.visualizationStyle = style;
    }

    setColors(colors) {
        this.colors = { ...this.colors, ...colors };
    }

    getOutputNode() {
        return this.analyser;
    }

    async start(container) {
        if (this.isActive) return;

        // Create canvas
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'visualizer-canvas';
        this.canvasCtx = this.canvas.getContext('2d');

        // Set canvas size
        this.canvas.width = container.clientWidth || window.innerWidth;
        this.canvas.height = container.clientHeight || window.innerHeight;

        container.appendChild(this.canvas);

        this.isActive = true;
        this.draw();

        // Handle resize
        this.resizeHandler = () => {
            if (this.canvas) {
                this.canvas.width = container.clientWidth || window.innerWidth;
                this.canvas.height = container.clientHeight || window.innerHeight;
            }
        };
        window.addEventListener('resize', this.resizeHandler);
    }

    stop() {
        this.isActive = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        this.canvas = null;
        this.canvasCtx = null;
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
            this.resizeHandler = null;
        }
    }

    draw() {
        if (!this.isActive || !this.canvasCtx || !this.analyser) return;

        this.animationId = requestAnimationFrame(() => this.draw());

        this.analyser.getByteFrequencyData(this.dataArray);

        const width = this.canvas.width;
        const height = this.canvas.height;

        // Clear canvas
        this.canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.canvasCtx.fillRect(0, 0, width, height);

        switch (this.visualizationStyle) {
            case 'bars':
                this.drawBars(width, height);
                break;
            case 'waveform':
                this.drawWaveform(width, height);
                break;
            case 'circular':
                this.drawCircular(width, height);
                break;
            default:
                this.drawBars(width, height);
        }
    }

    drawBars(width, height) {
        const barCount = 128;
        const barWidth = width / barCount;
        const step = Math.floor(this.bufferLength / barCount);

        for (let i = 0; i < barCount; i++) {
            const barHeight = (this.dataArray[i * step] / 255) * height * 0.8;
            const x = i * barWidth;
            const y = height - barHeight;

            // Create gradient
            const gradient = this.canvasCtx.createLinearGradient(0, height, 0, y);
            gradient.addColorStop(0, this.colors.primary);
            gradient.addColorStop(0.5, this.colors.secondary);
            gradient.addColorStop(1, this.colors.accent);

            this.canvasCtx.fillStyle = gradient;
            this.canvasCtx.fillRect(x, y, barWidth - 2, barHeight);
        }
    }

    drawWaveform(width, height) {
        this.analyser.getByteTimeDomainData(this.dataArray);

        this.canvasCtx.lineWidth = 3;
        this.canvasCtx.strokeStyle = this.colors.primary;
        this.canvasCtx.beginPath();

        const sliceWidth = width / this.bufferLength;
        let x = 0;

        for (let i = 0; i < this.bufferLength; i++) {
            const v = this.dataArray[i] / 128.0;
            const y = (v * height) / 2;

            if (i === 0) {
                this.canvasCtx.moveTo(x, y);
            } else {
                this.canvasCtx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        this.canvasCtx.lineTo(width, height / 2);
        this.canvasCtx.stroke();
    }

    drawCircular(width, height) {
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 3;
        const barCount = 180;
        const step = Math.floor(this.bufferLength / barCount);

        for (let i = 0; i < barCount; i++) {
            const barHeight = (this.dataArray[i * step] / 255) * radius * 0.8;
            const angle = (i / barCount) * Math.PI * 2;

            const x1 = centerX + Math.cos(angle) * radius;
            const y1 = centerY + Math.sin(angle) * radius;
            const x2 = centerX + Math.cos(angle) * (radius + barHeight);
            const y2 = centerY + Math.sin(angle) * (radius + barHeight);

            // Create gradient
            const gradient = this.canvasCtx.createLinearGradient(x1, y1, x2, y2);
            gradient.addColorStop(0, this.colors.secondary);
            gradient.addColorStop(1, this.colors.primary);

            this.canvasCtx.strokeStyle = gradient;
            this.canvasCtx.lineWidth = 2;
            this.canvasCtx.beginPath();
            this.canvasCtx.moveTo(x1, y1);
            this.canvasCtx.lineTo(x2, y2);
            this.canvasCtx.stroke();
        }
    }

    extractColorsFromImage(_imageUrl) {
        // This would use a library like Vibrant.js to extract colors from album art
        // For now, we'll just use the default colors
        return new Promise((resolve) => {
            resolve(this.colors);
        });
    }

    destroy() {
        this.stop();
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
        this.audioContext = null;
        this.source = null;
        this.analyser = null;
    }
}
