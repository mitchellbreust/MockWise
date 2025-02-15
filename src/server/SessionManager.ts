import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';

interface PendingSession {
    resume: string;
    jobInfo: string;
    createdAt: number;
}

interface AIConfig {
    model: string;
    baseUrl: string;
    voice: string;
    baseInstructions: string;
}

export class SessionManager {
    private pendingSessions: Map<string, PendingSession> = new Map();
    private openai: OpenAI;
    private config: AIConfig = {
        model: "gpt-4o-realtime-preview-2024-12-17",
        baseUrl: "https://api.openai.com/v1/realtime",  
        voice: "alloy",
        baseInstructions: `You are a technical interviewer conducting a job interview. Follow these guidelines:
            1. Ask relevant technical questions based on the candidate's background
            2. Start with easier questions and gradually increase difficulty
            3. Ask follow-up questions when answers are incomplete
            4. Be professional but friendly
            5. Focus on practical problem-solving abilities
            6. Avoid theoretical questions unless specifically relevant
            7. Give the candidate time to think and respond
            8. One question at a time
            Do not break character or acknowledge that you are an AI.`
    };

    constructor() {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY environment variable is required');
        }

        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }

    createSessionToken(resume: string, jobInfo: string): string {
        const token = uuidv4();
        this.pendingSessions.set(token, {
            resume,
            jobInfo,
            createdAt: Date.now()
        });

        setTimeout(() => {
            this.pendingSessions.delete(token);
        }, 5 * 60 * 1000); // 5 minutes expiry

        return token;
    }

    isValidToken(token: string): boolean {
        const session = this.pendingSessions.get(token);
        if (!session) return false;

        const isExpired = Date.now() - session.createdAt > 5 * 60 * 1000;
        if (isExpired) {
            this.pendingSessions.delete(token);
            return false;
        }
        return true;
    }

    private generateInstructions(resume: string, jobInfo: string): string {
        return `${this.config.baseInstructions}

        Candidate's Resume:
        ${resume}

        Job Description:
        ${jobInfo}

        Use this context to:
        1. Focus questions on skills mentioned in both the resume and job description
        2. Validate the candidate's claimed experience
        3. Assess their suitability for the specific role
        4. Identify any gaps between their experience and job requirements`;
    }

    async initializeWebRTC(token: string) {
        const session = this.pendingSessions.get(token);
        if (!session) throw new Error('Invalid session');

        try {
            // Get ephemeral token from OpenAI
            const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: this.config.model,
                    voice: this.config.voice
                }),
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`OpenAI API error: ${error}`);
            }

            const data = await response.json();
            
            return {
                ephemeralToken: data.client_secret.value,
                baseUrl: this.config.baseUrl,
                model: this.config.model
            };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('Failed to initialize OpenAI session:', errorMessage);
            if (error instanceof Error) {
                console.error('Stack:', error.stack);
            }
            throw error; // Re-throw to be handled by the caller
        }
    }
}
