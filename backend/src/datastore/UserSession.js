export class UserSession {
    constructor(session, aiObj = null, userSocketObj = null, aiSocketObj = null) {
        this.session = session;
        this.ai = aiObj;
        this.userSocketObj = userSocketObj;
        this.aiSocketObj = aiSocketObj;
    }

    updateAiObj(aiObj) {
        this.ai = aiObj;
    }

    updateAiSocketObj(aiSocketObj) {
        this.aiSocketObj = aiSocketObj;
    }

    updateUserSocketObj(userSocketObj) {
        this.userSocketObj = userSocketObj;
    }
}
