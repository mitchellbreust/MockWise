import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { API_URL } from '../config';
import { config } from 'dotenv';

const ChatContainer = styled.div`
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  height: 75vh;
  background: transparent;
  border-radius: 16px;
  box-shadow: var(--shadow-md);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);

  @media (prefers-color-scheme: dark) {
    background: linear-gradient(to bottom, #1e293b, #0f172a);
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.05);
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--text-secondary);
    border-radius: 4px;
  }
`;

const MessageGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: ${props => props.$isUser ? 'flex-end' : 'flex-start'};
  margin-bottom: 16px;
  max-width: 85%;
  align-self: ${props => props.$isUser ? 'flex-end' : 'flex-start'};
`;

const Message = styled.div`
  padding: 12px 16px;
  border-radius: 20px;
  max-width: 100%;
  word-wrap: break-word;
  background-color: ${props => props.$isUser ? '#0084ff' : '#f0f0f0'};
  color: ${props => props.$isUser ? 'white' : '#000'};
  margin: 2px 0;
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-1px);
  }
  
  /* Instagram-style bubbles */
  ${props => props.$isUser ? `
    border-bottom-right-radius: 4px;
  ` : `
    border-bottom-left-radius: 4px;
  `}
`;

const AudioPlayer = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
    padding: 8px 12px;
    background: ${props => props.$isUser ? '#2563eb22' : '#f3f4f6'};
    border-radius: 16px;
    width: fit-content;
`;

const PlayButton = styled.button`
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    background: ${props => props.$isPlaying ? '#2563eb' : '#e2e8f0'};
    color: ${props => props.$isPlaying ? 'white' : '#4a5568'};
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
`;

const Waveform = styled.div`
    width: 100px;
    height: 20px;
    background: ${props => props.$isPlaying ? '#2563eb33' : '#e2e8f0'};
    border-radius: 10px;
`;

const InputArea = styled.div`
  display: flex;
  gap: 10px;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.05);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0 0 16px 16px;
  backdrop-filter: blur(8px);
`;

const Input = styled.textarea`
  flex: 1;
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  min-height: 60px;
  background: var(--background-color);
  color: var(--text-primary);
  transition: border-color 0.2s ease;
  resize: none;
  font-size: 1rem;
  line-height: 1.5;

  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
  }
`;

const Button = styled.button`
  padding: 0 20px;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
  height: fit-content;
  align-self: flex-end;
  &:disabled { opacity: 0.5; }

  &:hover:not(:disabled) {
    background-color: var(--primary-hover);
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }
`;

const TranscriptionText = styled.div`
  font-style: italic;
  color: #666;
  padding: 8px 12px;
  background: #f8f8f8;
  border-radius: 12px;
  margin-top: 4px;
  font-size: 0.9em;
`;

const RecordingPulse = styled.div`
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: #ef4444;
    opacity: 0.6;
    animation: ${props => props.$isRecording ? 'pulse 2s infinite' : 'none'};

    @keyframes pulse {
        0% {
            transform: scale(1);
            opacity: 0.6;
        }
        50% {
            transform: scale(1.4);
            opacity: 0;
        }
        100% {
            transform: scale(1);
            opacity: 0;
        }
    }
`;

const MicButton = styled.button`
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: none;
    background: ${props => props.$isRecording ? '#ef4444' : '#2563eb'};
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
    opacity: ${props => props.$disabled ? 0.5 : 1};
    transition: all 0.2s ease;
    margin-left: 8px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    
    &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    &:active:not(:disabled) {
        transform: translateY(0);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    svg {
        width: 32px;   // Increased from 24px
        height: 32px;  // Increased from 24px
        transition: all 0.2s ease;
        ${props => props.$isRecording && `
            transform: scale(0.85);
        `}
    }
`;

function InterviewChat({ sessionToken, resume, jobInfo }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [audioMessages, setAudioMessages] = useState(new Map());
    const [currentTranscript, setCurrentTranscript] = useState('');
    const peerConnection = useRef(null);
    const dataChannel = useRef(null);
    const outputAudioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const transcriptQueue = useRef([]);
    const isProcessingTranscript = useRef(false);
    const [isRecording, setIsRecording] = useState(false);
    const [hasMicPermission, setHasMicPermission] = useState(false);
    const mediaRecorder = useRef(null);

    const setupConnection = async () => {
        try {
            // Get token
            const response = await fetch(`${API_URL}/api/webrtc/init`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${sessionToken}` }
            });
            const { ephemeralToken, baseUrl, model } = await response.json();

            // Create and store peer connection
            const pc = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });
            peerConnection.current = pc;

            // Set up audio with controls
            const audioEl = document.createElement('audio');
            audioEl.autoplay = false; // Disable autoplay
            audioEl.controls = false; // Hide native controls
            outputAudioRef.current = audioEl;
            
            pc.ontrack = e => {
                console.log('Received audio track');
                audioEl.srcObject = e.streams[0];
            };

            // Add local audio track
            const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
                .catch(() => {
                    console.log('Using dummy audio');
                    const ctx = new AudioContext();
                    const dst = ctx.createMediaStreamDestination();
                    return dst.stream;
                });
            audioStream.getTracks().forEach(track => pc.addTrack(track, audioStream));

            // Create data channel
            const dc = pc.createDataChannel('oai-events');
            configDc(dc);
            dataChannel.current = dc;

            // Complete WebRTC setup
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            
            const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${ephemeralToken}`,
                    'Content-Type': 'application/sdp'
                },
                body: pc.localDescription.sdp
            });

            const answer = { type: 'answer', sdp: await sdpResponse.text() };
            await pc.setRemoteDescription(answer);

        } catch (error) {
            console.error('Setup failed:', error);
        }
    };

    const processTranscriptQueue = async () => {
        if (isProcessingTranscript.current || transcriptQueue.current.length === 0) {
            return;
        }

        isProcessingTranscript.current = true;
        
        while (transcriptQueue.current.length > 0) {
            const nextChunk = transcriptQueue.current.shift();
            setMessages(prev => {
                const lastMsg = prev[prev.length - 1];
                if (lastMsg?.type === 'interviewer') {
                    return [...prev.slice(0, -1), 
                        { ...lastMsg, text: (lastMsg.text || '') + nextChunk }];
                }
                return [...prev, { text: nextChunk, type: 'interviewer' }];
            });
            // Add delay between chunks
            await new Promise(resolve => setTimeout(resolve, 250)); // Adjust delay as needed
        }

        isProcessingTranscript.current = false;
    };

    const configDc = (dc) => {
        dc.onopen = () => {
            console.log('Connected');
            setIsConnected(true);
            
            // Send session update
            dc.send(JSON.stringify({
                type: "session.update",
                session: {
                    instructions: `You are a technical interviewer conducting a job interview. Your role is to:
                        1. First, briefly introduce yourself as the interviewer and state the position being interviewed for
                        2. Use the candidate's resume to ask targeted questions about their experience
                        3. Reference specific projects and skills from their resume
                        4. Ask questions that evaluate their fit for the job requirements
                        5. Keep responses focused and professional
                        6. Provide constructive feedback after each answer
                        
                        Context:
                        Resume: ${resume}
                        Job Description: ${jobInfo}
                        
                        Format: Natural conversational language, no prefixes or labels.`,
                    voice: "alloy"
                }
            }));
        };

        dc.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'session.updated') {
                console.log('Session updated, sending initial response request');
                // Only create response after session is updated
                dc.send(JSON.stringify({
                    type: "response.create",
                    response: {
                        modalities: ["text", "audio"]
                    }
                }));
            } else if (data.type === 'output_audio_buffer.started') {
                transcriptQueue.current = [];
                isProcessingTranscript.current = false;
                setCurrentTranscript('');
                setIsPlaying(true);
                outputAudioRef.current?.play();
            } else if (data.type === 'output_audio_buffer.stopped') {
                setIsPlaying(false);
                outputAudioRef.current?.pause();
            } else if (data.type === 'response.audio_transcript.delta') {
                // Queue transcript chunks instead of updating immediately
                if (data.delta) {
                    transcriptQueue.current.push(data.delta);
                    processTranscriptQueue();
                }
            } 
        };
    }

    const sendMessage = () => {
        if (!input.trim() || !dataChannel.current) return;

        // Add the message to conversation
        dataChannel.current.send(JSON.stringify({
            type: "conversation.item.create",
            item: {
                type: "message",
                role: "user",
                content: [{ type: "input_text", text: input }]
            }
        }));

        dataChannel.current.send(JSON.stringify({
            type: "response.create",
            response: { 
                modalities: ["text", "audio"]
            }
        }));

        setMessages(prev => [...prev, { text: input, type: 'user' }]);
        setInput('');
    };

    const checkMicPermission = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setHasMicPermission(true);
            stream.getTracks().forEach(track => track.stop());
        } catch (err) {
            console.log('Mic permission denied:', err);
            setHasMicPermission(false);
        }
    };

    const toggleRecording = async () => {
        if (isRecording) {
            mediaRecorder.current?.stop();
            setIsRecording(false);
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder.current = new MediaRecorder(stream);
                
                mediaRecorder.current.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        const reader = new FileReader();
                        reader.onload = () => {
                            const base64Audio = reader.result.split(',')[1];
                            dataChannel.current?.send(JSON.stringify({
                                type: "input_audio_buffer.append",
                                audio: base64Audio
                            }));
                        };
                        reader.readAsDataURL(event.data);
                    }
                };

                mediaRecorder.current.onstop = () => {
                    stream.getTracks().forEach(track => track.stop());
                    dataChannel.current?.send(JSON.stringify({
                        type: "input_audio_buffer.commit"
                    }));
                    dataChannel.current?.send(JSON.stringify({
                        type: "response.create",
                        response: { modalities: ["text", "audio"] }
                    }));
                };

                mediaRecorder.current.start(250); // Send chunks every 250ms
                setIsRecording(true);
            } catch (err) {
                console.error('Failed to start recording:', err);
            }
        }
    };

    useEffect(() => {
        checkMicPermission();
        setupConnection();
        return () => {
            peerConnection.current?.close();
            audioMessages.forEach(url => URL.revokeObjectURL(url));
        };
    }, [sessionToken]);

    return (
        <ChatContainer>
            <MessagesContainer>
                {messages.map((msg, i) => (
                    <MessageGroup key={i} $isUser={msg.type === 'user'}>
                        <Message $isUser={msg.type === 'user'}>
                            {msg.text}
                        </Message>
                    </MessageGroup>
                ))}
                {/* Show live transcription */}
                {currentTranscript && (
                    <MessageGroup $isUser={false}>
                        <Message $isUser={false}>
                            <TranscriptionText>
                                {currentTranscript}
                            </TranscriptionText>
                        </Message>
                    </MessageGroup>
                )}
            </MessagesContainer>
            <InputArea>
                <Input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Type your message..."
                />
                <Button onClick={sendMessage} disabled={!isConnected}>
                    Send
                </Button>
                <MicButton
                    onClick={toggleRecording}
                    $isRecording={isRecording}
                    disabled={!isConnected || !hasMicPermission}
                    $disabled={!isConnected || !hasMicPermission}
                >
                    {isRecording && <RecordingPulse $isRecording />}
                    <svg 
                        viewBox="0 0 24 24" 
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{ margin: '-4px' }}  // Add negative margin to adjust position
                    >
                        {isRecording ? (
                            <path d="M6 6h12v12H6z" />  // Adjusted stop icon
                        ) : (
                            <path d="M12 15c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v7c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 15 6.7 12H5c0 3.41 2.72 6.23 6 6.72V22h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />  // Simplified mic icon
                        )}
                    </svg>
                </MicButton>
            </InputArea>
        </ChatContainer>
    );
}

export default InterviewChat;
