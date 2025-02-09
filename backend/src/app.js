import express from "express";
import { WebSocket } from "ws";
import { v4 as uuidv4 } from 'uuid';
import { ClientManager } from "./datastore/clientManager";
import { startNewInterview } from "./controller";
import UserWebSocketServer from "./webSockets/UserWebSocketServer";
import { validateRequestBody } from "./middleware/validationMiddleware";
import { errorHandler } from "./middleware/errorMiddleware";

const dataStore = new ClientManager();
const wssUser = new UserWebSocketServer(new WebSocket.Server({ noServer: true }));

const app = express();
const port = 8080;

app.use(express.json());
app.use(errorHandler);

app.post('/startInterview', validateRequestBody, (req, res) => {
    const resume = req.body.resume ? req.body.resume : "";
    const jobDescription = req.body.jobDescription ? req.body.jobDescription : "";
    const session = uuidv4();

    startNewInterview(session, resume, jobDescription, dataStore, wssUser, req);

    res.status(200).send('WebSocket connection initiated.');
});


app.listen(port, () => {
    console.log("Server started on port " + port);
});
