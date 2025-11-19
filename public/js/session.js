/**
 * Utilitaires pour la gestion des sessions avec cookies
 */
class SessionManager {
    constructor() {
        this.sessionData = this.loadSessionFromCookie();
    }

    /**
     * Sauvegarde les données de session dans un cookie
     */
    saveSessionToCookie(data) {
        const sessionData = {
            ...this.sessionData,
            ...data,
            lastActivity: Date.now()
        };
        
        // Sauvegarder dans un cookie qui expire dans 24h
        const expires = new Date();
        expires.setTime(expires.getTime() + (24 * 60 * 60 * 1000));
        
        document.cookie = `vache_taureau_session=${encodeURIComponent(JSON.stringify(sessionData))}; expires=${expires.toUTCString()}; path=/`;
        this.sessionData = sessionData;
        
        console.log('📝 Session sauvegardée:', sessionData);
    }

    /**
     * Charge les données de session depuis le cookie
     */
    loadSessionFromCookie() {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'vache_taureau_session') {
                try {
                    const sessionData = JSON.parse(decodeURIComponent(value));
                    console.log('📖 Session chargée:', sessionData);
                    return sessionData;
                } catch (e) {
                    console.warn('❌ Erreur lors du chargement de la session:', e);
                    this.clearSession();
                    return {};
                }
            }
        }
        return {};
    }

    /**
     * Récupère une valeur de session
     */
    get(key) {
        return this.sessionData[key];
    }

    /**
     * Définit une valeur de session
     */
    set(key, value) {
        this.sessionData[key] = value;
        this.saveSessionToCookie(this.sessionData);
    }

    /**
     * Vérifie si l'utilisateur a une session active
     */
    hasActiveSession() {
        return this.sessionData.playerName && this.sessionData.roomId;
    }

    /**
     * Récupère les informations du joueur
     */
    getPlayerInfo() {
        return {
            name: this.sessionData.playerName,
            roomId: this.sessionData.roomId,
            isHost: this.sessionData.isHost || false
        };
    }

    /**
     * Met à jour les informations de la room
     */
    updateRoomInfo(roomId, isHost = false) {
        this.set('roomId', roomId);
        this.set('isHost', isHost);
    }

    /**
     * Met à jour le nom du joueur
     */
    updatePlayerName(playerName) {
        this.set('playerName', playerName);
    }

    /**
     * Efface la session
     */
    clearSession() {
        document.cookie = 'vache_taureau_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
        this.sessionData = {};
        console.log('🗑️ Session effacée');
    }

    /**
     * Vérifie si la session est expirée (plus de 24h)
     */
    isSessionExpired() {
        const lastActivity = this.sessionData.lastActivity;
        if (!lastActivity) return true;
        
        const now = Date.now();
        const twentyFourHours = 24 * 60 * 60 * 1000;
        return (now - lastActivity) > twentyFourHours;
    }
}

// Instance globale
window.sessionManager = new SessionManager();
