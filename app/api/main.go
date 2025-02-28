package main;

import (
	"fmt"
	"net/http"
	"github.com/joho/godotenv"
	"log"
	"os"
)

// CORS Middleware
func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "https://mock-wise.online") // Allow frontend
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization") // Allow Authorization header
		w.Header().Set("Access-Control-Allow-Credentials", "true") // Allow cookies

		// Handle preflight OPTIONS request
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}



func main() {
	port := os.Getenv("PORT") // Get Railway’s assigned port
    if port == "" {
        port = "8080" // Default to 8080 for local testing
    }

	// Load variables from .env file into environment
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: No .env file found. Using system environment variables.")
	}
	
	fs := http.FileServer(http.Dir("../dist"))

	// Apply CORS middleware
	mux := http.NewServeMux()
	mux.Handle("/", fs)
	mux.HandleFunc("/create-interview", HandleStartNewInt)
	mux.HandleFunc("/stream-transcribe", HandleTranscribeAudio)

	fmt.Println("Server started on " + port)
	http.ListenAndServe(":"+port, enableCORS(mux))
}
