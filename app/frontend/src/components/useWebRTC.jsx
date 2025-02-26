import { useEffect, useRef } from "react";

const useWebRTC = (outputAudioRef, processTranscriptQueue, transcriptQueue, isProcessingTranscript, setCurrentTranscript,  setIsConnected ,setIsPlaying,ephemeralToken, resume, jobInfo) => {
    const peerConnection = useRef(null)
    const dataChannel = useRef(null)

    const setupConnection = async () => {
        try {
            const baseUrl = "https://api.openai.com/v1/realtime";
            const model = "gpt-4o-realtime-preview-2024-12-17";

            const pc = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });
            peerConnection.current = pc;

            const audioEl = document.createElement('audio');
            audioEl.autoplay = true;
            document.body.appendChild(audioEl);
            outputAudioRef.current = audioEl;

            pc.ontrack = e => {
                console.log('Received audio track');
                audioEl.srcObject = e.streams[0];
            };

            // Create data channel
            const dc = pc.createDataChannel('oai-events');
            configDc(dc);
            dataChannel.current = dc;

            const offer = await pc.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: false
            });
            
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

    const configDc = (dc) => {
        dc.onopen = () => {
            console.log('Connected');
            
            // Send session update
            dc.send(JSON.stringify({
                type: "session.update",
                session: {
                    instructions: `You are a technical interviewer conducting a job interview. Your role is to:
                        1. First, briefly introduce yourself as the interviewer and state the position being interviewed for
                        2. Use the candidate's resume to ask targeted questions about their experience
                        3. Reference specific things on resume
                        4. Ask questions that evaluate their fit for the job requirements
                        5. Keep responses focused and professional
                        6. Provide constructive feedback after each answer
                        7. If needed, ask for clarification or more details
                        8. If possible, and found necessary, ask a follow-up question based on the candidate's response
                        9. Your name is Ash.
                        
                        Context:
                        Resume: ${resume}
                        Job Description: ${jobInfo}
                        
                        Format: Natural conversational language, no prefixes or labels.`,
                    voice: "ash"
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
            } else if (data.type === 'conversation.item.created') {
                dataChannel.current.send(JSON.stringify({
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
                setIsConnected(false);
            } else if (data.type === 'output_audio_buffer.stopped') {
                setIsPlaying(false);
                outputAudioRef.current?.pause();
                setIsConnected(true);
            } else if (data.type === 'response.audio_transcript.delta') {
                // Queue transcript chunks instead of updating immediately
                if (data.delta) {
                    transcriptQueue.current.push(data.delta);
                    processTranscriptQueue();
                }
            } 
        };
    }

  return { peerConnection, dataChannel, setupConnection };
}

export default useWebRTC