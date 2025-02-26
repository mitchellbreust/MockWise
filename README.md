# MockWise

MockWise is an innovative interviewing assistant that leverages real-time AI to simulate an interactive interview experience. It sends audio prompts to the user and listens for real-time responses, tailoring questions based on the user's resume and job information.

## Features

- **Real-Time Audio Interaction:**  
  Experience a dynamic interview environment where AI delivers audio prompts and listens to your responses in real time.

- **Tailored Interview Questions:**  
  Interview questions are customized using your resume and job-specific information to ensure relevance and depth.

- **Interactive Experience:**  
  Engage in a simulated interview session that adapts to your answers, helping you prepare effectively.

## Technology Stack

- **Backend:**  
  Built with [Golang](https://golang.org/) for a fast, efficient server-side experience.

- **Frontend:**  
  Developed using [React JS](https://reactjs.org/) to provide a responsive and intuitive user interface.

- **Real-Time Communication:**  
  Utilizes [WebRTC](https://webrtc.org/) in combination with OpenAI's realtime API to handle live audio interactions.

- **Transcription Service:**  
  Integrated with [AssemblyAI's API](https://www.assemblyai.com/) to transcribe user responses in real time.

## Installation

### Prerequisites

- [Golang](https://golang.org/dl/) installed on your system.
- [Node.js and npm](https://nodejs.org/) for the React frontend.
- API keys for OpenAI realtime API and AssemblyAI.

### Steps

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/mitchellbreust/MockWise.git
   cd app
   ```

2. **Set up frontend:**
   
  ```bash
  cd ./frontend
  npm install
  npm run build
  cd ../
  ```

3. **Set up Server:**

   ```bash
   cd ./api
   go mod download
   ```
  
5. **Create a .env & run**
   - In the .env set API_KEY, TRANSCRIBE_API
   - Then:
     
       ```bash
       go run .
       ```
       


