import WebSocket from 'ws';
import fetch from 'node-fetch';

// Make POST request
fetch('http://localhost:8080/startInterview', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        resume: 'Test resume',
        jobDescription: 'Test job description'
    })
})
.then(response => response.json())
.then(({ sessionId }) => {
    if (!sessionId) {
        throw new Error('No session ID received');
    }

    // Create WebSocket connection with sessionId
    const ws = new WebSocket(`ws://localhost:8080/interview?sessionId=${sessionId}`);
    
    ws.on('open', () => {
        console.log('Connected to WebSocket');
    });
    
    ws.on('message', (data) => {
        console.log('Received:', data.toString());
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });

    ws.on('close', () => {
        console.log('WebSocket connection closed');
    });
})
.catch(error => {
    console.error('Error:', error);
});