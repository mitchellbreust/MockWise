import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { API_URL } from '../config';
import useAudioRecorder from './useAudioRecorder';
import useWebRTC from './useWebRTC';

const ChatContainer = styled.div`
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  height: 75vh;
  background: var(--foreground);
  border-radius: 16px;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border);
  backdrop-filter: blur(8px);
  
  @media (max-width: 768px) {
    padding: 12px;
    height: 85vh;
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

  @media (max-width: 768px) {
    padding: 12px;
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
  background-color: ${props => props.$isUser ? 'var(--message-user)' : 'var(--message-bot)'};
  color: ${props => props.$isUser ? 'white' : 'var(--text-primary)'};
  margin: 2px 0;
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-1px);
  }

  ${props => props.$isUser ? `
    border-bottom-right-radius: 4px;
  ` : `
    border-bottom-left-radius: 4px;
  `}

  @media (max-width: 768px) {
    padding: 10px 14px;
    font-size: 0.95rem;
  }
`;


const InputArea = styled.div`
  display: flex;
  gap: 10px;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.05);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0 0 16px 16px;
  backdrop-filter: blur(8px);

  @media (max-width: 768px) {
    padding: 12px;
    gap: 8px;
  }
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

  @media (max-width: 768px) {
    min-height: 48px;
    font-size: 0.95rem;
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

  @media (max-width: 768px) {
    padding: 0 15px;
    font-size: 0.9rem;
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

    @media (max-width: 768px) {
        width: 42px;
        height: 42px;
        
        svg {
          width: 28px;
          height: 28px;
        }
    }
`;

const TranscribingIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f0f0f0;
  border-radius: 20px;
  color: #666;
  font-style: italic;
`;

const DotAnimation = styled.div`
  display: inline-flex;
  gap: 4px;
  
  span {
    width: 4px;
    height: 4px;
    background: #666;
    border-radius: 50%;
    animation: dotPulse 1.4s infinite;
    
    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }

  @keyframes dotPulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(0.5); opacity: 0.5; }
  }
`;

const WarningBanner = styled.div`
  background-color: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
  color: #92400e;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;

  svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }
`;

function InterviewChat({ sessionToken, resume, jobInfo, ephemeralToken }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [currentTranscript, setCurrentTranscript] = useState('');
    const outputAudioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const transcriptQueue = useRef([]);
    const isProcessingTranscript = useRef(false);
    const mediaRecorder = useRef(null);
    const [hasMicrophoneAccess, setHasMicrophoneAccess] = useState(null);

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

        setMessages(prev => [...prev, { text: input, type: 'user' }]);
        setInput('');
    };

    const {peerConnection, dataChannel, setupConnection} = useWebRTC(outputAudioRef, processTranscriptQueue, transcriptQueue, isProcessingTranscript, setCurrentTranscript , setIsConnected, setIsPlaying ,ephemeralToken, resume, jobInfo)
    const { isRecording, isTranscribing, startRecording, stopRecording, toggleRecording } = useAudioRecorder(API_URL, dataChannel, setMessages)

    useEffect(async() => {
        await setupConnection();
        return () => {
            peerConnection.current?.close();
            if (mediaRecorder.current) {
                stopRecording();
            }
        };
    }, [sessionToken]);

    useEffect(() => {
        // Check microphone access when component mounts
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(() => setHasMicrophoneAccess(true))
            .catch(() => setHasMicrophoneAccess(false));
    }, []);

    return (
        <ChatContainer>
            {hasMicrophoneAccess === false && (
                <WarningBanner>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-2h2v2h-2zm0-10v6h2V7h-2z"/>
                    </svg>
                    Microphone access is disabled. Voice input features will not be available. Please check your browser settings to enable microphone access.
                </WarningBanner>
            )}
            <MessagesContainer>
                {messages.map((msg, i) => (
                    <MessageGroup key={i} $isUser={msg.type === 'user'}>
                        <Message $isUser={msg.type === 'user'}>
                            {msg.text}
                        </Message>
                    </MessageGroup>
                ))}
                {isTranscribing && (
                    <MessageGroup $isUser={true}>
                        <TranscribingIndicator>
                            Transcribing
                            <DotAnimation>
                                <span />
                                <span />
                                <span />
                            </DotAnimation>
                        </TranscribingIndicator>
                    </MessageGroup>
                )}
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
                    disabled={!isConnected || !hasMicrophoneAccess}
                    $disabled={!isConnected || !hasMicrophoneAccess}
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