import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { AssemblyAI, SpeechModel, TranscribeParams, AudioToTranscribe } from 'assemblyai';
import path from 'path';
import { promises as fs } from 'fs';
import os from 'os';
import { createWriteStream } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { SessionManager } from './SessionManager';
import http from 'http'; // Add this import
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import winston from 'winston';

// Check environment variables after imports
if (!process.env.OPENAI_API_KEY || !process.env.ASSEMBLYAI_API_KEY) {
    console.error('OPENAI_API_KEY environment variable is missing');
    process.exit(1);
}

// Setup logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

const app = express();
const port = process.env.PORT || 3000;
const sessionManager = new SessionManager();
const apiKey = process.env.OPENAI_API_KEY;
const assemblyClient = new AssemblyAI({
    apiKey: process.env.ASSEMBLYAI_API_KEY,
  });

const server = http.createServer({
    // Force HTTP/1.1
    requestTimeout: 300000, // 5 minutes timeout for long requests
    keepAliveTimeout: 310000, // Keep alive slightly longer than request timeout
}, app);

// Security middleware
app.use(helmet());
app.use(limiter);
app.use(morgan('combined'));

// CORS configuration for production
app.use(cors({
  origin: [
    ...process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
    '.elasticbeanstalk.com',
    'http://mockwise-env.eba-cfmp97zy.us-west-2.elasticbeanstalk.com/'  // Add your specific URL here
  ],
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Add static file serving for the frontend
app.use(express.static(path.join(__dirname, '../../public')));

// Add health check endpoint at the top of your routes
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

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

// Add streaming audio endpoint
app.post('/api/stream-transcribe', (req, res) => {
    // Set proper headers for HTTP/1.1
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Transfer-Encoding', 'chunked');

    const fileId = uuidv4();
    const tempFile = path.join(os.tmpdir(), `stream-${fileId}.webm`);
    const writeStream = createWriteStream(tempFile);
    
    // Pipe the request directly to the file
    req.pipe(writeStream);

    req.on('end', async () => {
        try {
            // Wait for write to finish
            await new Promise(resolve => writeStream.end(resolve));
            
            const data = {
                audio: tempFile,
                speech_model: 'nano'
            } as any;

            const transcript = await assemblyClient.transcripts.transcribe(data);
            
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

// Add this as the last route before error handling
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

// Error handling middleware
app.use((err: Error, req: any, res: any, next: any) => {
  logger.error(err.stack);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal Server Error' 
      : err.message
  });
});

// Update server listening with better error handling
server.listen(process.env.PORT || 8081, () => {
  console.log(`Server running on port ${process.env.PORT || 8081}`);
}).on('error', (error) => {
  console.error('Server failed to start:', error);
  logger.error('Server failed to start:', error);
});