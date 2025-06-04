document.addEventListener('DOMContentLoaded', () => {
    const recordButton = document.getElementById('record-button');
    const stopButton = document.getElementById('stop-button');
    const conversationArea = document.getElementById('conversation-area');
    const audioPlayer = document.getElementById('audio-player');

    let mediaRecorder;
    let audioChunks = [];
    let webSocket;

    // Placeholder for WebSocket URL - replace with actual backend URL
    const WS_URL = 'ws://localhost:8000/ws'; // Example: Update this later

    function addMessageToConversation(message, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add(sender === 'user' ? 'user-message' : 'ai-message');
        messageDiv.textContent = message;
        conversationArea.appendChild(messageDiv);
        conversationArea.scrollTop = conversationArea.scrollHeight; // Scroll to bottom
    }

    function connectWebSocket() {
        webSocket = new WebSocket(WS_URL);

        webSocket.onopen = () => {
            console.log('WebSocket connection established');
            addMessageToConversation('Connected to advisor service.', 'system');
        };

        webSocket.onmessage = (event) => {
            // Assuming the server sends back an object with type and data
            // e.g., { type: 'text', data: 'Hello from AI' }
            // or { type: 'audio', data: 'base64encodedAudioData' }
            // or { type: 'audio_url', data: 'url_to_audio_file.wav'}

            try {
                const message = JSON.parse(event.data);
                if (message.type === 'text') {
                    addMessageToConversation(message.data, 'ai');
                } else if (message.type === 'audio_url') {
                    // If server sends a URL to an audio file
                    addMessageToConversation('AI is responding with audio...', 'ai');
                    audioPlayer.src = message.data;
                    audioPlayer.hidden = false;
                    audioPlayer.play();
                } else if (message.type === 'audio_blob') {
                    // If server sends audio data directly as a blob (more complex to handle client-side)
                    // This example assumes server sends a URL or text for simplicity for now.
                    // For direct audio blob:
                    // const audioBlob = new Blob([message.data], { type: 'audio/wav' }); // Adjust MIME type
                    // const audioUrl = URL.createObjectURL(audioBlob);
                    // audioPlayer.src = audioUrl;
                    // audioPlayer.hidden = false;
                    // audioPlayer.play();
                    addMessageToConversation('AI sent audio data.', 'ai');
                    console.log('Received audio blob data (needs handling)');
                } else {
                    addMessageToConversation(event.data, 'ai'); // Fallback for simple text
                }
            } catch (e) {
                console.error('Error parsing message or unknown message format:', event.data);
                addMessageToConversation('Received raw data: ' + event.data, 'ai');
            }
        };

        webSocket.onclose = () => {
            console.log('WebSocket connection closed');
            addMessageToConversation('Disconnected from advisor service.', 'system');
            recordButton.disabled = true;
            stopButton.disabled = true;
        };

        webSocket.onerror = (error) => {
            console.error('WebSocket error:', error);
            addMessageToConversation('Error connecting to advisor service.', 'system');
        };
    }

    recordButton.addEventListener('click', async () => {
        if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
            addMessageToConversation('Connecting to service...', 'system');
            connectWebSocket(); // Attempt to connect if not already
            // Potentially wait for connection before starting recording, or handle in onopen
        }

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];

                mediaRecorder.ondataavailable = (event) => {
                    audioChunks.push(event.data);
                };

                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' }); // Default type, may need conversion
                    // For Gemini, we need PCM 16kHz. This will require server-side conversion
                    // or more complex client-side processing.
                    // For now, we send it as is, and the server will need to handle it.

                    if (webSocket && webSocket.readyState === WebSocket.OPEN) {
                        // We should ideally send raw PCM, but browser MediaRecorder typically gives webm/ogg.
                        // Sending the blob directly. Server will need to process.
                        // A common approach is to read the Blob as an ArrayBuffer and send that.
                        const reader = new FileReader();
                        reader.onload = function(event) {
                            if (event.target.result instanceof ArrayBuffer) {
                                webSocket.send(event.target.result);
                                addMessageToConversation('You (audio sent)', 'user');
                            }
                        };
                        reader.readAsArrayBuffer(audioBlob);

                    } else {
                        addMessageToConversation('Not connected. Please try again.', 'system');
                    }

                    // Clean up
                    stream.getTracks().forEach(track => track.stop());
                };

                mediaRecorder.start();
                recordButton.disabled = true;
                stopButton.disabled = false;
                addMessageToConversation('Recording...', 'system');

            } catch (err) {
                console.error('Error accessing microphone:', err);
                addMessageToConversation('Error accessing microphone. Please check permissions.', 'system');
            }
        } else {
            addMessageToConversation('getUserMedia not supported on your browser!', 'system');
        }
    });

    stopButton.addEventListener('click', () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            recordButton.disabled = false;
            stopButton.disabled = true;
            addMessageToConversation('Recording stopped. Processing...', 'system');
        }
    });

    // Initial connection attempt
    // connectWebSocket(); // Or connect on first record click
});
