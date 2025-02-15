import WebSocket from 'ws';
import axios from 'axios';

async function testConnection() {
    try {
        console.log('1. Requesting session token...');
        const sessionResponse = await axios.post('http://localhost:3000/api/session', {
            resume: 'I am a software engineer with 5 years of experience in TypeScript and Node.js',
            jobInfo: 'Senior Software Engineer position requiring strong backend skills'
        });

        console.log('Session response:', sessionResponse.data);
        const { sessionToken, wsUrl } = sessionResponse.data;

        console.log('2. Attempting WebSocket connection...');
        const ws = new WebSocket(`ws://localhost:3000?token=${sessionToken}`);

        ws.onopen = () => {
            console.log('3. WebSocket connection established');
            
            // Send a test message
            const testMessage = {
                type: 'answer',
                answer: 'This is a test answer'
            };
            
            console.log('4. Sending test message:', testMessage);
            ws.send(JSON.stringify(testMessage));
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data.toString());
            console.log('5. Received message from server:', data);
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            // Log additional error details
            if (error instanceof Error) {
                console.error('Error details:', {
                    message: error.message,
                    name: error.name,
                    stack: error.stack
                });
            }
        };

        ws.onclose = (event) => {
            console.log('WebSocket closed:', {
                code: event.code,
                reason: event.reason,
                wasClean: event.wasClean
            });
        };

        // Keep the process alive
        process.stdin.resume();

        // Handle cleanup on exit
        process.on('SIGINT', () => {
            console.log('Cleaning up...');
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
            process.exit(0);
        });

    } catch (error) {
        console.error('Test failed:', error);
        if (axios.isAxiosError(error)) {
            console.error('Axios error details:', {
                response: error.response?.data,
                status: error.response?.status,
                headers: error.response?.headers
            });
        }
        process.exit(1);
    }
}

console.log('Starting connection test...');
testConnection();
