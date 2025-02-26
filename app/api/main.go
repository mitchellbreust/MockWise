package main;

import (
	"fmt"
	"net/http"
	"github.com/joho/godotenv"
	"log"
)

func main() {
	// Load variables from .env file into environment
	err := godotenv.Load()
	if err != nil {
		log.Fatalf("Error loading .env file: %v", err)
	}

	fs := http.FileServer(http.Dir("../dist"))
    http.Handle("/", fs)

	http.HandleFunc("/create-interview", HandleStartNewInt)
	http.HandleFunc("/stream-transcribe", HandleTranscribeAudio)
	fmt.Println("Server started on 8080")
    http.ListenAndServe(":8080", nil)
}
