
export default class UserSocketCon {
    constructor(ws) {
        this.ws = ws;
        this.setupWebSocket();
    }

    setupWebSocket() {
        this.ws.on("message", (data) => {
            try {
                const message = JSON.parse(data);
                this.handleMessage(message);
            } catch (error) {
                console.error('Failed to parse message:', error);
            }
        });

        this.ws.on('close', () => {
            console.log('User connection closed');
        });

        this.ws.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
    }

    handleMessage(message) {
        if (!message.type) {
            this.sendError('Message type is required');
            return;
        }
    }

    sendError(message) {
        this.send({ type: 'error', message });
    }

    send(data) {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }
}