//js/listening-stats.js
// Listening Statistics Tracker

export class ListeningStats {
    constructor() {
        this.STORAGE_KEY = 'multichrome-listening-stats';
        this.currentTrack = null;
        this.startTime = null;
        this.isPlaying = false;
        this.stats = this.loadStats();
    }

    loadStats() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.warn('Failed to load listening stats:', e);
        }

        return {
            tracks: {}, // trackId -> { count, totalTime, lastPlayed, title, artist, album, cover }
            artists: {}, // artistId -> { count, totalTime, name }
            albums: {}, // albumId -> { count, totalTime, title, artist }
            history: [], // Array of {trackId, timestamp, duration}
            totalListenTime: 0,
            startDate: Date.now()
        };
    }

    saveStats() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.stats));
        } catch (e) {
            console.warn('Failed to save listening stats:', e);
        }
    }

    startTracking(track) {
        if (!track || !track.id) return;

        this.currentTrack = track;
        this.startTime = Date.now();
        this.isPlaying = true;
    }

    pauseTracking() {
        if (!this.isPlaying || !this.currentTrack || !this.startTime) return;

        const listenTime = (Date.now() - this.startTime) / 1000; // in seconds
        
        // Only count if listened for at least 30 seconds
        if (listenTime >= 30) {
            this.updateStats(this.currentTrack, listenTime);
        }

        this.isPlaying = false;
    }

    resumeTracking() {
        if (!this.currentTrack) return;
        
        this.startTime = Date.now();
        this.isPlaying = true;
    }

    stopTracking() {
        this.pauseTracking();
        this.currentTrack = null;
        this.startTime = null;
    }

    updateStats(track, listenTime) {
        const trackId = track.id;
        const artistId = track.artist?.id || track.artists?.[0]?.id;
        const albumId = track.album?.id;

        // Update track stats
        if (!this.stats.tracks[trackId]) {
            this.stats.tracks[trackId] = {
                count: 0,
                totalTime: 0,
                lastPlayed: null,
                title: track.title,
                artist: track.artist?.name || track.artists?.[0]?.name || 'Unknown',
                album: track.album?.title || 'Unknown',
                cover: track.album?.cover || track.cover || ''
            };
        }
        this.stats.tracks[trackId].count++;
        this.stats.tracks[trackId].totalTime += listenTime;
        this.stats.tracks[trackId].lastPlayed = Date.now();

        // Update artist stats
        if (artistId) {
            if (!this.stats.artists[artistId]) {
                this.stats.artists[artistId] = {
                    count: 0,
                    totalTime: 0,
                    name: track.artist?.name || track.artists?.[0]?.name || 'Unknown'
                };
            }
            this.stats.artists[artistId].count++;
            this.stats.artists[artistId].totalTime += listenTime;
        }

        // Update album stats
        if (albumId) {
            if (!this.stats.albums[albumId]) {
                this.stats.albums[albumId] = {
                    count: 0,
                    totalTime: 0,
                    title: track.album?.title || 'Unknown',
                    artist: track.artist?.name || track.artists?.[0]?.name || 'Unknown',
                    cover: track.album?.cover || ''
                };
            }
            this.stats.albums[albumId].count++;
            this.stats.albums[albumId].totalTime += listenTime;
        }

        // Update history
        this.stats.history.push({
            trackId: trackId,
            timestamp: Date.now(),
            duration: listenTime
        });

        // Keep only last 1000 history entries
        if (this.stats.history.length > 1000) {
            this.stats.history = this.stats.history.slice(-1000);
        }

        // Update total listen time
        this.stats.totalListenTime += listenTime;

        this.saveStats();
    }

    getTopTracks(limit = 10) {
        return Object.entries(this.stats.tracks)
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }

    getTopArtists(limit = 10) {
        return Object.entries(this.stats.artists)
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }

    getTopAlbums(limit = 10) {
        return Object.entries(this.stats.albums)
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }

    getRecentTracks(limit = 20) {
        const recentHistory = [...this.stats.history].reverse().slice(0, limit);
        
        return recentHistory.map(entry => {
            const trackData = this.stats.tracks[entry.trackId];
            return {
                ...trackData,
                id: entry.trackId,
                timestamp: entry.timestamp,
                duration: entry.duration
            };
        });
    }

    getTotalStats() {
        const totalTracks = Object.keys(this.stats.tracks).length;
        const totalArtists = Object.keys(this.stats.artists).length;
        const totalAlbums = Object.keys(this.stats.albums).length;
        const totalPlays = Object.values(this.stats.tracks).reduce((sum, track) => sum + track.count, 0);
        const avgDuration = totalPlays > 0 ? this.stats.totalListenTime / totalPlays : 0;

        return {
            totalTracks,
            totalArtists,
            totalAlbums,
            totalPlays,
            totalListenTime: this.stats.totalListenTime,
            avgDuration,
            startDate: this.stats.startDate
        };
    }

    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }

    formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
        return `${Math.floor(diffDays / 365)} years ago`;
    }

    clearStats() {
        this.stats = {
            tracks: {},
            artists: {},
            albums: {},
            history: [],
            totalListenTime: 0,
            startDate: Date.now()
        };
        this.saveStats();
    }
}
