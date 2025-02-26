package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"api/session"
	"time"
	"os"
)

type NewInterview struct {
	Resume string `json:"resume"`
	Job string `json:"job"`
}

type EphemeralTokenReqBody struct {
	Model string `json:"model"`
	Voice string `json:"voice"`
}

type TokenResponse struct {
    ClientSecret struct {
        Value string `json:"value"`
    } `json:"client_secret"`
}

func HandleStartNewInt(resW http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodPost {
        http.Error(resW, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }

	// Get request body and error check. Expecting Json data: resume & job
	var interview NewInterview
	err := json.NewDecoder(req.Body).Decode(&interview)
	if err != nil {
		http.Error(resW, "Error passing body to NewInterview type: " + err.Error(), 400)
		return
	}
	if len(interview.Resume) == 0 {
		http.Error(resW, "Invalid resume: no content", 400)
		return
	}
	if len(interview.Job) == 0 {
		http.Error(resW, "Invalid job: no nontent", 400)
		return
	}

	// Generate a session token for user
	token, err := session.CreateToken()
	if err != nil {
		http.Error(resW, "Issue generating user session on server side: " + err.Error(), 500)
		return
	}

	// Set up Json Body for a request to Open Ai to get ephemeral token for user
	reqBody := EphemeralTokenReqBody{
		Model: "gpt-4o-realtime-preview-2024-12-17",
		Voice: "verse",
	}
	marshalledReqBody, err := json.Marshal(reqBody)
	if err != nil {
		http.Error(resW, "Error making request for ephemeral token: could not marshal req body", 500)
		return
	}

	apiKey := os.Getenv("API_KEY")
    if apiKey == "" {
		http.Error(resW, "No api key found on server for open ai", 500)
		return
    }

	// Construct request to Open Ai
	newReq, err:= http.NewRequest("POST", "https://api.openai.com/v1/realtime/sessions", bytes.NewReader(marshalledReqBody))
	if err != nil {
		http.Error(resW, "Error creating request object", 500)
		return
	} 
	newReq.Header.Set("Authorization", "Bearer " + apiKey)
	newReq.Header.Set("Content-Type", "application/json")

	// Execute request to Open Ai
	client := http.Client{Timeout: 1 * time.Minute}
	resAI, err := client.Do(newReq)
	if err != nil {
		http.Error(resW, "Error getting ephemeral token from open ai: " + err.Error(), 500);
		return
	}
	defer resAI.Body.Close()

	if resAI.StatusCode != 200 {
		http.Error(resW, "Bad request to open Ai server", 500)
		return
	}

	// Get ephemeral token in response body from Open Ai
	var tokenRes TokenResponse
	err = json.NewDecoder(resAI.Body).Decode(&tokenRes)
	if err != nil {
		http.Error(resW, "Error, could not find ephemeral token from ai response: " + err.Error(), 500)
		return
	}

	// Send ephemeral token to client, as well as session, and also attach to cookies
	resW.Header().Set("Content-Type", "application/json");
	http.SetCookie(resW, &http.Cookie{
		Name:     "session_token",
		Value:    token,
		Expires:  time.Now().Add(24 * time.Hour),
		HttpOnly: true,
		Secure:   true,
		Path:     "/",
	})
	json.NewEncoder(resW).Encode(map[string]string{"session": token, "token": tokenRes.ClientSecret.Value})
}