
export default class UserWebSocketServer {
    constructor(wssUser) {
        this.wss = wssUser;
        wsServer.on('connection', socket => {
            socket.on('error', err => console.error('Websocket error:', err))
          
            // on initial connection, send an example message
            socket.send(JSON.stringify({ type: 'serverHello', message: 'hello' }))
          })
    }
}