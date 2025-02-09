import { UserSession } from "./datastore/UserSession";
import {Ai} from "./AI/Ai";
import UserSocketCon from "./webSockets/UserSocketCon";
import AiSocketCon from "./webSockets/AiSocketCon";
import WebSocket from "ws";


export function startNewInterview(sessionId, resume, jobDescription, dataStore, wssUser, req) {
    const newInterview = new Ai(resume, jobDescription);

    const clientSocket = req.socket;
    let newUserSocket;
    wssUser.wss.handleUpgrade(req, clientSocket, req.head, (ws) => {
        wssUser.wss.emit('connection', ws, req);
        newUserSocket = new UserSocketCon(ws);
    });

    const wsAi = new WebSocket("url");
    const newAiSocket = new AiSocketCon(wsAi);

    const newUserSession = new UserSession(sessionId, newInterview, newUserSocket, newAiSocket);
    dataStore.addNewSession(sessionId, newUserSession);
}