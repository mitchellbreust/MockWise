import { UserSession } from "./datastore/UserSession";
import {Ai} from "./AI/Ai";
import UserSocketCon from "./webSockets/UserSocketCon";
import AiSocketCon from "./webSockets/AiSocketCon";
import WebSocket from "ws";


export function handleNewSocketInterviewConnetion(ws, dataStore, sessionId) {
    const userSession = dataStore.getSession(sessionId);

    const newUserWebSocketCon = new UserSocketCon(ws);
    userSession.updateUserWebSocketCon(newUserWebSocketCon);

    const newAiWebSocketCon = new AiSocketCon(new WebSocket('url'));
    userSession.updateAiWebSocketCon(newAiWebSocketCon);
}