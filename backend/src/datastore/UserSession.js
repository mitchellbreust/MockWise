
export class UserSession {
    constructor(session, ai = null, userSocketCon = null, aiSocketCon = null) {
        this.session = session;
        this.ai = ai;
        this.userSocketCon = userSocketCon;
        this.aiSocketCon = aiSocketCon;
    }

    updateAiObj(ai) {
        this.ai = ai;
    }

    updateAiSocketObj(aiSocketCon) {
        this.aiSocketCon = aiSocketCon;
    }

    updateUserSocketObj(userSocketCon) {
        this.userSocketCon = userSocketCon;
    }
}
