import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { AssemblyAI } from 'assemblyai';
import multer from 'multer';
import path from 'path';
import { promises as fs } from 'fs';
import os from 'os';
import { createWriteStream } from 'fs';
import { v4 as uuidv4 } from 'uuid';

import { SessionManager } from './SessionManager';


const app = express();
const port = process.env.PORT || 3000;
const sessionManager = new SessionManager();
const assemblyClient = new AssemblyAI({
    apiKey: '3f65148e76764d21b1611d48e2bc195e'
});
const storage = multer.memoryStorage();
const upload = multer({ storage });


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

app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No audio file provided' });
    }

    try {
        // Create temp directory if it doesn't exist
        const tempDir = path.join(os.tmpdir(), 'interview-recordings');
        await fs.mkdir(tempDir, { recursive: true });

        // Create temporary file
        const tempFile = path.join(tempDir, `recording-${Date.now()}.webm`);
        await fs.writeFile(tempFile, req.file.buffer);

        try {
            // Transcribe using AssemblyAI
            const data = {
                audio: tempFile,
                speech_model: 'nano'
            };

            const transcript = await assemblyClient.transcripts.transcribe(data);

            // Send response
            res.json({
                success: true,
                text: transcript.text
            });

        } finally {
            // Clean up temp file
            await fs.unlink(tempFile).catch(console.error);
        }

    } catch (error) {
        console.error('Transcription error:', error);
        res.status(500).json({
            error: 'Transcription failed',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});

// Add streaming audio endpoint
app.post('/api/stream-transcribe', (req, res) => {
    const fileId = uuidv4();
    const tempFile = path.join(os.tmpdir(), `stream-${fileId}.webm`);
    const writeStream = createWriteStream(tempFile);
    
    req.on('data', chunk => {
        writeStream.write(chunk);
    });

    req.on('end', async () => {
        writeStream.end();

        try {
            // Transcribe the complete file
            const data = {
                audio: tempFile,
                speech_model: 'nano'
            };

            const transcript = await assemblyClient.transcripts.transcribe(data);
            
            // Send response
            res.json({
                success: true,
                text: transcript.text
            });

        } catch (error) {
            console.error('Transcription error:', error);
            res.status(500).json({
                error: 'Transcription failed',
                details: error instanceof Error ? error.message : String(error)
            });
        } finally {
            // Clean up
            fs.unlink(tempFile).catch(console.error);
        }
    });

    req.on('error', (error) => {
        console.error('Stream error:', error);
        writeStream.end();
        fs.unlink(tempFile).catch(console.error);
        res.status(500).json({ error: 'Stream processing failed' });
    });
});

app.listen(port, () => console.log(`Server running on port ${port}`));