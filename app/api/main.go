package main;

import (
	"fmt"
	"net/http"
	"github.com/joho/godotenv"
	"log"
	"os"
)

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
    http.Handle("/", fs)

	http.HandleFunc("/create-interview", HandleStartNewInt)
	http.HandleFunc("/stream-transcribe", HandleTranscribeAudio)
	fmt.Println("Server started on " + port)
    http.ListenAndServe(":"+port, nil)
}
