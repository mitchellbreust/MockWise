
export class ClientManager {
    constructor() {
        this.dataStore = new Map();
    }

    addNewSession(session, userSession) {
        this.dataStore.set(session, userSession);
    }

    getSession(session) {
        return this.dataStore.get(session);
    }

    hasSession(session) {
        return this.dataStore.has(session);
    }
}
