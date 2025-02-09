import express from "express";
import { WebSocketServer } from "ws";
import { ClientManager } from "./datastore/clientManager";
import UserWebSocketServer from "./webSockets/UserWebSocketServer";
import { v4 as uuidv4 } from 'uuid';
import { Ai } from "./AI/Ai";
import { UserSession } from "./datastore/UserSession";
import AiSocketCon from "./webSockets/AiSocketCon";
import WebSocket from "ws";
import { handleNewSocketInterviewConnetion } from "./controller";

const app = express();
app.use(express.json());

const dataStore = new ClientManager();
const wss = new WebSocketServer({ noServer: true });
const userWebSocketServer = new UserWebSocketServer(wss);

const port = 8080;

app.post('/startInterview', (req, res) => {
    const sessionId = uuidv4();
    const { resume, jobDescription } = req.body;
    
    // Create AI instance
    const newInterview = new Ai(resume, jobDescription);
    
    // Create session before WebSocket upgrade
    const newUserSession = new UserSession(sessionId, newInterview, null, null);
    dataStore.addNewSession(sessionId, newUserSession);
    
    res.json({ sessionId });
});

const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
    userWebSocketServer.startHeartbeat();
});

server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const sessionId = url.searchParams.get('sessionId');
    
    if (url.pathname === '/interview' && sessionId && dataStore.hasSession(sessionId)) {
        userWebSocketServer.wss.handleUpgrade(request, socket, head, socket => {
           userWebSocketServer.wss.emit('connection', socket, request);
           handleNewSocketInterviewConnetion(socket, dataStore, sessionId);
          })
    } else {
        socket.destroy();
    }
});
