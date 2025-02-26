package main

import (
	"net/http"
	"os"
	"context"
	"encoding/json"
	"io"
	"bytes"
	aai "github.com/AssemblyAI/assemblyai-go-sdk"
	"api/session"
)

type TranscriptText struct {
    Text string `json:"text"`
}


func HandleTranscribeAudio(resW http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodPost {
        http.Error(resW, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }

	// Verify cookie
	cookie, err := req.Cookie("session_token")
	if err != nil {
		http.Error(resW, "Unauthorized: missing session token", http.StatusUnauthorized)
		return
	}
	err = session.VerifyToken(cookie.Value)
	if err != nil {
		http.Error(resW, "Bad token: " + err.Error(), 400)
		return
	}

	// Verify Content-Type header
	if req.Header.Get("Content-Type") != "audio/webm" {
		http.Error(resW, "Unsupported content type", http.StatusBadRequest)
		return
	}

	// Read the audio data from the request body
	audioData, err := io.ReadAll(req.Body)
	if err != nil {
		http.Error(resW, "Error reading audio data", http.StatusInternalServerError)
		return
	}
	defer req.Body.Close()

	apiKey := os.Getenv("TRANSCRIBE_API")
    if apiKey == "" {
		http.Error(resW, "No api key found on server for transcribe", 500)
		return
    }

	client := aai.NewClient(apiKey)
	ctx := context.Background()

  	// transcript parameters where SpeechModel has been set to Nano
	params := &aai.TranscriptOptionalParams{SpeechModel: "nano"}
	reader := bytes.NewReader(audioData)
	transcript, err := client.Transcripts.TranscribeFromReader(ctx, reader, params)
	if err != nil {
		http.Error(resW, "Error transcribing: " + err.Error(), 500)
		return
	}

	// Get transctibed text
	transcriptText := aai.ToString(transcript.Text)

	// Respond with the transcribed text in JSON format
	resW.Header().Set("Content-Type", "application/json")
	json.NewEncoder(resW).Encode(map[string]string{"text": transcriptText})
}