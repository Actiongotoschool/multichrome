// js/firebase/auth.js
import { initializeFirebase } from './config.js';

let firebaseAuthModule = null;

async function getFirebaseAuth() {
    if (firebaseAuthModule) return firebaseAuthModule;
    
    try {
        const [{ auth, provider }, authModule] = await Promise.all([
            initializeFirebase(),
            import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js'),
        ]);
        
        if (!auth) {
            return null;
        }
        
        firebaseAuthModule = {
            auth,
            provider,
            ...authModule,
        };
        return firebaseAuthModule;
    } catch (error) {
        console.warn('Firebase Auth not available:', error.message);
        return null;
    }
}

export class AuthManager {
    constructor() {
        this.user = null;
        this.unsubscribe = null;
        this.authListeners = [];
        this.init();
    }

    async init() {
        try {
            const firebase = await getFirebaseAuth();
            if (!firebase || !firebase.auth) return;

            this.unsubscribe = firebase.onAuthStateChanged(firebase.auth, (user) => {
                this.user = user;
                this.updateUI(user);
                this.authListeners.forEach((listener) => listener(user));
            });
        } catch (error) {
            console.warn('Firebase Auth initialization skipped:', error.message);
        }
    }

    onAuthStateChanged(callback) {
        this.authListeners.push(callback);
        // If we already have a user state, trigger immediately
        if (this.user !== null) {
            callback(this.user);
        }
    }

    async signInWithGoogle() {
        const firebase = await getFirebaseAuth();
        if (!firebase || !firebase.auth) {
            alert('Firebase is not configured. Please check console.');
            return;
        }

        try {
            const result = await firebase.signInWithPopup(firebase.auth, firebase.provider);
            // The onAuthStateChanged listener will handle the rest
            return result.user;
        } catch (error) {
            console.error('Login failed:', error);
            alert(`Login failed: ${error.message}`);
            throw error;
        }
    }

    async signInWithEmail(email, password) {
        const firebase = await getFirebaseAuth();
        if (!firebase || !firebase.auth) {
            alert('Firebase is not configured.');
            return;
        }
        try {
            const result = await firebase.signInWithEmailAndPassword(firebase.auth, email, password);
            return result.user;
        } catch (error) {
            console.error('Email Login failed:', error);
            alert(`Login failed: ${error.message}`);
            throw error;
        }
    }

    async signUpWithEmail(email, password) {
        const firebase = await getFirebaseAuth();
        if (!firebase || !firebase.auth) {
            alert('Firebase is not configured.');
            return;
        }
        try {
            const result = await firebase.createUserWithEmailAndPassword(firebase.auth, email, password);
            return result.user;
        } catch (error) {
            console.error('Sign Up failed:', error);
            alert(`Sign Up failed: ${error.message}`);
            throw error;
        }
    }

    async signOut() {
        const firebase = await getFirebaseAuth();
        if (!firebase || !firebase.auth) return;

        try {
            await firebase.signOut(firebase.auth);
            // The onAuthStateChanged listener will handle the rest
        } catch (error) {
            console.error('Logout failed:', error);
            throw error;
        }
    }

    updateUI(user) {
        const connectBtn = document.getElementById('firebase-connect-btn');
        const clearDataBtn = document.getElementById('firebase-clear-cloud-btn');
        const statusText = document.getElementById('firebase-status');
        const emailContainer = document.getElementById('email-auth-container');
        const emailToggleBtn = document.getElementById('toggle-email-auth-btn');

        if (!connectBtn) return; // UI might not be rendered yet

        if (user) {
            connectBtn.textContent = 'Sign Out';
            connectBtn.classList.add('danger');
            connectBtn.onclick = () => this.signOut();

            if (clearDataBtn) clearDataBtn.style.display = 'block';
            if (emailContainer) emailContainer.style.display = 'none';
            if (emailToggleBtn) emailToggleBtn.style.display = 'none';

            if (statusText) statusText.textContent = `Signed in as ${user.email}`;
        } else {
            connectBtn.textContent = 'Connect with Google';
            connectBtn.classList.remove('danger');
            connectBtn.onclick = () => this.signInWithGoogle();

            if (clearDataBtn) clearDataBtn.style.display = 'none';
            if (emailToggleBtn) emailToggleBtn.style.display = 'inline-block';

            if (statusText) statusText.textContent = 'Sync your library across devices';
        }
    }
}

export const authManager = new AuthManager();
