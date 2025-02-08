import express from "express";
import Ai from "./AI/Ai";
import { WebSocket } from "ws";
import { v4 as uuidv4 } from 'uuid'; // You can use a package like uuid to generate session IDs
import ClientManager from "./datastore/clientManager";
import { UserSession } from "./datastore/UserSession";
import UserSocketCon from "./webSockets/UserSocketCon";
import AiSocketCon from "./webSockets/AiSocketCon";

const dataStore = new ClientManager();
const wssUser = new WebSocket.Server({ noServer: true });

const app = express();
const port = 8080;
app.use(express.json());

// Define the 'connection' event to handle when a new WebSocket is opened
wssUser.on('connection', (ws, req) => {
    console.log('New WebSocket connection established');
});

app.post('/startInterview', (req, res) => {
    let resume = req.body.resume ? req.body.resume : "";
    let jobDescription = req.body.jobDescription ? req.body.jobDescription : "";
    const newInterview = new Ai(resume, jobDescription);

    const session = uuidv4();
    const newUserSession = new UserSession(session, newInterview);

    const clientSocket = req.socket;
    wssUser.handleUpgrade(req, clientSocket, req.head, (ws) => {
        wssUser.emit('connection', ws, req);
        const newUserSocket = new UserSocketCon(ws)
        newUserSession.updateUserSocketObj(newUserSocket);
    });

    const wsAi = new WebSocket("url");
    const newAiSocket = new AiSocketCon(wsAi)
    newUserSession.updateAiSocketObj(newAiSocket);

    dataStore.addNewSession(session, newUserSession);

    res.status(200).send('WebSocket connection initiated.');
});

app.listen(port, () => {
    console.log("Server started on port " + port);
});
