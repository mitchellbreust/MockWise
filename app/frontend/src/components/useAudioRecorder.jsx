import { useRef, useState } from 'react';

const useAudioRecorder = (API_URL, dataChannel, setMessages) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const mediaStream = useRef(null);
  const audioContext = useRef(null);
  const mediaStreamSource = useRef(null);
  const scriptProcessor = useRef(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStream.current = stream;
            mediaRecorder.current = new MediaRecorder(stream);
            audioChunks.current = [];

            // Set up Web Audio API
            audioContext.current = new AudioContext();
            mediaStreamSource.current = audioContext.current.createMediaStreamSource(stream);
            // Ignore deprecation warning since AudioWorklet isn't widely supported yet
            scriptProcessor.current = audioContext.current.createScriptProcessor(4096, 1, 1);

            mediaRecorder.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.current.push(event.data);
                }
            };

            scriptProcessor.current.onaudioprocess = () => {
                // Just to keep the audio context alive
            };

            // Connect nodes
            mediaStreamSource.current.connect(scriptProcessor.current);
            scriptProcessor.current.connect(audioContext.current.destination);

            mediaRecorder.current.onstop = async () => {
                const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
                try {
                    const response = await fetch(`${API_URL}/stream-transcribe`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'audio/webm' },
                        body: audioBlob,
                        credentials: "include"
                    });

                    if (response.ok) {
                        const { text } = await response.json();
                        setMessages(prev => [...prev, { text, type: 'user' }]);
                        dataChannel.current?.send(JSON.stringify({
                            type: "conversation.item.create",
                            item: {
                                type: "message",
                                role: "user",
                                content: [{ type: "input_text", text }]
                            }
                        }));
                    }
                } catch (error) {
                    console.error('Transcription error:', error);
                } finally {
                    setIsTranscribing(false); // Stop transcribing animation
                }
            };

            mediaRecorder.current.start(1000);
            setIsRecording(true);
        } catch (error) {
            console.error('Failed to start recording:', error);
        }
    };

    const stopRecording = () => {
        if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
            setIsTranscribing(true); // Start transcribing animation
            mediaRecorder.current.stop();
        }
        if (mediaStream.current) {
            mediaStream.current.getTracks().forEach(track => track.stop());
        }
        if (scriptProcessor.current) {
            scriptProcessor.current.disconnect();
        }
        if (audioContext.current) {
            audioContext.current.close();
        }
        setIsRecording(false);
    };

    // Replace the existing toggleRecording function
    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

  return { isRecording, isTranscribing, startRecording, stopRecording, toggleRecording };
};

export default useAudioRecorder;