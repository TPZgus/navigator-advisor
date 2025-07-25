# TPZ Realtime AI Advisor

A real-time voice and text-based advisory application designed to support students in The Possible Zone (TPZ) program. This application uses Google's Gemini Live API for conversational AI capabilities.

## Features

*   Real-time voice interaction with an AI advisor (McCoy persona).
*   Text input option for interacting with the AI.
*   Powered by Google's Gemini Live API.
*   Automatic saving of conversation transcripts (timestamped text files in `outputs/transcripts/`).
*   Basic web interface with a central voice orb for interaction.

## Setup and Running the Application

1.  **Prerequisites:**
    *   Node.js (v18.x or higher recommended) and npm.
    *   FFmpeg: Ensure FFmpeg is installed on your system and accessible in your PATH. This is required for server-side audio conversion. (You can download it from [ffmpeg.org](https://ffmpeg.org/download.html) or install via package managers like `brew`, `apt`, etc.).

2.  **Clone the Repository (Once it's on GitHub):**
    ```bash
    # git clone [URL_OF_YOUR_GITHUB_REPO]
    # cd [REPO_NAME]
    ```

3.  **API Keys:**
    *   Copy the `.env.example` file to a new file named `.env`:
        ```bash
        cp .env.example .env
        ```
    *   Edit the `.env` file and add your Google Gemini API Key:
        ```
        GEMINI_API_KEY="YOUR_ACTUAL_GEMINI_API_KEY"
        ```
    *   Ensure the "Generative Language API" is enabled for your Google Cloud Project associated with this API key.

4.  **Install Dependencies:**
    *   Open your terminal in the project directory and run:
        ```bash
        npm install
        ```

5.  **Run the Application:**
    *   To run in development mode (with auto-restart on file changes):
        ```bash
        npm run dev
        ```
    *   Alternatively, to just start the server:
        ```bash
        npm start
        ```
    *   The application will be available at `http://localhost:3000`.

## Integration with Navigator Ecosystem

This standalone application serves as an initial demonstration and proof-of-concept for the TPZ Realtime AI Advisor. The ultimate goal is to integrate this advising functionality into the existing "Navigator" student-facing dashboard and web-app ecosystem.

**Considerations for Integration:**

Looks like our TPZ "Navigator" ecosystem  consist of several components:

*   **`navigator-rails`**: The Rails backend.
*   **`navigator-web`**: Admin views, and potentially future student views (React frontend, likely).
*   **`navigator-mobile`**: Mobile application (React Native or similar, likely).
*   **`navigator-shared`**: Shared types and API services.

**Potential Integration Strategies:**

1.  **Backend Service Integration (Recommended for Core AI Logic):**
    *   The core Node.js server (`server.js`) of this AI advisor (which handles the direct WebSocket connection to Google Gemini Live API, audio processing with FFmpeg, and transcript logic) could be maintained as a separate microservice.
    *   `navigator-rails` (the main backend) could then communicate with this AI advisor microservice, possibly via internal HTTP API calls or a message queue, to initiate sessions or retrieve data.
    *   Alternatively, the core logic for interacting with the Gemini Live API (direct WebSocket handling, audio processing) could be re-implemented within the `navigator-rails` backend itself if a Node.js microservice is not desired, though this would require Ruby equivalents for WebSocket clients and FFmpeg interaction.

2.  **Frontend Component Integration (For UI):**
    *   **`navigator-web` (React):** The UI elements (voice orb, chat display, controls) from this standalone app's `static/` and `templates/` directories can be rebuilt as React components within the `navigator-web` frontend.
        *   These React components would then communicate with a WebSocket endpoint exposed by either the standalone AI advisor Node.js service (if kept separate) or directly by `navigator-rails` (if the AI logic is embedded there).
        *   The `static/script.js` and `static/audio-player-processor.js` contain the core client-side logic for WebSocket communication, microphone handling, and AudioWorklet playback, which would need to be adapted into React custom hooks or components.
    *   **`navigator-mobile`:** A similar approach would apply. Native modules or React Native equivalents for WebSocket communication, microphone access, audio playback, and FFmpeg (if client-side conversion is chosen) would be needed. The UI would be built with native components.

3.  **Shared Services (`navigator-shared`):**
    *   If this AI advisor becomes a more integrated service, any shared data types (e.g., for transcript structure, student interaction events) could be defined in `navigator-shared` for consistency between `navigator-web`, `navigator-mobile`, and the backend handling the AI.

4.  **Linking Out (Simpler Initial Step):**
    *   As an interim measure, the main Navigator student interface could simply link out to this standalone AI advisor application if it's hosted separately. This would provide immediate access while a deeper integration is planned.

The choice of integration strategy will depend on the overall architecture of the Navigator platform and team preferences. The current standalone version provides a working model of the core AI interaction that can be adapted and incorporated.

## Next Steps / To-Do

1.  Align this with frameworks/conventions for our KM (Knowledge Management) team.
2.  Investigate possible lingering audio buffer/other input audio niggles (working, but sometimes not responsive, could just be a threshold thing, more testing needed).
3.  Beyond transcript: What's the data back end for this? Needs to align with KM endpoint (maybe start just by sending time-stamped, student-IDed transcripts and/or competency data based on transcripts?).
4.  Mobile friendly UI/UX.
5.  Fix text display so students can see email addresses clearly when referred to a human.
6.  Expanded (just for MVP) system prompt with basic info, but also lots of moments of "refer to [tpz member email] for specific things, like stipends, SST, and other flags that would bring in human to loop."
7.  Others we can add as we go.
# Automatic mirroring test - Fri Jul 25 09:29:52 EDT 2025
