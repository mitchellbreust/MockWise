export default class UserWebSocketServer {
    constructor(wssUser) {
        this.wss = wssUser;

        this.wss.on('connection', (ws, req) => {
            console.log('New WebSocket connection established\n Web socket:' + ws + "\n Request: " + req);
        });
    }
}