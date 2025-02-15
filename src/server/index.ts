import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { SessionManager } from './SessionManager';


const app = express();
const port = process.env.PORT || 3000;
const sessionManager = new SessionManager();


app.use(cors({
    origin: ['http://localhost:5173'],  // Add your Vite dev server port
    credentials: true
}));
app.use(express.json());

// Only two endpoints needed
app.post('/api/session', (req, res) => {
    const { resume, jobInfo } = req.body;
    if (!resume || !jobInfo) {
        return res.status(400).json({ error: 'Resume and job info required' });
    }
    const sessionToken = sessionManager.createSessionToken(resume, jobInfo);
    
    // Match the response structure expected by SetupForm
    res.json({ 
        sessionToken,
        status: 'success'
    });
});

app.post('/api/webrtc/init', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    console.log('WebRTC init request received');
    console.log('Headers:', req.headers);
    console.log('Token:', token);
    
    if (!token || !sessionManager.isValidToken(token)) {
        console.log('Token validation failed:', { token, valid: !!token && sessionManager.isValidToken(token) });
        return res.status(401).json({ error: 'Invalid token' });
    }

    try {
        console.log('Initializing WebRTC with token:', token);
        const config = await sessionManager.initializeWebRTC(token);
        console.log('WebRTC config generated:', JSON.stringify(config, null, 2));
        res.json(config);
    } catch (error: any) {
        console.error('WebRTC initialization failed:', error);
        console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace available');
        res.status(500).json({ 
            error: 'WebRTC initialization failed',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});


app.listen(port, () => console.log(`Server running on port ${port}`));