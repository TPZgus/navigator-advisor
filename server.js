import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import WebSocket from 'ws'; // For client connections to Google
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

// Configure ffmpeg
ffmpeg.setFfmpegPath(ffmpegStatic);

// Load environment variables
dotenv.config();
console.log('[ServerSetup] dotenv configured.');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
console.log('[ServerSetup] Directory paths configured.');

const app = express();
console.log('[ServerSetup] Express app initialized.');
const server = http.createServer(app);
console.log('[ServerSetup] HTTP server created.');
const wss = new WebSocketServer({ server });
console.log('[ServerSetup] WebSocket server initialized.');

const PORT = process.env.PORT || 3000; 
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error('CRITICAL ERROR: GEMINI_API_KEY not found in .env file.');
    // process.exit(1); // Optionally exit if key is absolutely critical for startup
} else {
    console.log('Gemini API Key found.');
}

const transcriptsDir = path.join(__dirname, 'outputs', 'transcripts');
console.log('[ServerSetup] Transcripts directory path set:', transcriptsDir);
if (!fs.existsSync(transcriptsDir)) {
    try {
        fs.mkdirSync(transcriptsDir, { recursive: true });
        console.log('[FileSys] Created transcripts directory:', transcriptsDir);
    } catch (err) {
        console.error(`[FileSys] Error creating transcripts directory: ${err}`);
        // process.exit(1); // Optionally exit if this is critical
    }
}

app.use('/static', express.static(path.join(__dirname, 'static')));
console.log('[ServerSetup] Static file serving configured.');
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});
console.log('[ServerSetup] Root route configured.');

const SYSTEM_PROMPT_TEXT_CORE = `
You are McCoy, a TPZ advisor. Your job is to help the user reflect on how their journey is going at The Possible Zone (TPZ).
You are talking to a high school student in a quick voice chat.
Speak informally, be friendly, helpful, and encouraging, like a good career coach from an urban area.
Keep your responses short, as this is a voice conversation. Use emojis where appropriate.
Start by asking them where they are in their entrepreneurship journey so far at TPZ.
Remember the TPZ program model: DISCOVER, EXPLORE, CREATE, DEEP DIVES.
Refer to TPZ competencies when relevant.
Your name is Elijah McCoy, but students can call you Eli or McCoy.
`;

wss.on('connection', (wsClient) => {
    console.log('[ServerWS] Client connected.');
    let googleWs = null; 
    let isGoogleSessionSetupComplete = false;
    let currentSystemPrompt = SYSTEM_PROMPT_TEXT_CORE; 
    let currentAiResponseBuffer = ""; 

    const sessionStartTime = new Date();
    const formattedSessionStartTime = `${sessionStartTime.getFullYear()}${(sessionStartTime.getMonth() + 1).toString().padStart(2, '0')}${sessionStartTime.getDate().toString().padStart(2, '0')}_${sessionStartTime.getHours().toString().padStart(2, '0')}${sessionStartTime.getMinutes().toString().padStart(2, '0')}${sessionStartTime.getSeconds().toString().padStart(2, '0')}`;
    const transcriptFilename = `tpz_transcript_${formattedSessionStartTime}.txt`;
    const transcriptFilePath = path.join(transcriptsDir, transcriptFilename);

    console.log(`[ServerWS] New session. Transcript will be saved to: ${transcriptFilePath}`);
    try {
        fs.appendFileSync(transcriptFilePath, `Session Started: ${sessionStartTime.toISOString()}\n------------------------------------------\n\n`);
    } catch (err) {
        console.error(`[ServerWS] Error writing initial transcript header: ${err}`);
    }

    wsClient.on('message', async (message) => {
        const messageString = message.toString();
        let parsedMessage;

        try {
            parsedMessage = JSON.parse(messageString);
            console.log('[ServerWS] Received from client. Type:', parsedMessage.type);
        } catch (e) { 
            console.error('[ServerWS] Failed to parse message from client (expecting JSON):', messageString, e);
            if (wsClient.readyState === WebSocket.OPEN) {
                wsClient.send(JSON.stringify({ type: 'error', data: 'Invalid message format. Expecting JSON.' }));
            }
            return;
        }

        if (parsedMessage.type === 'gemini_config' && !googleWs) {
            currentSystemPrompt = parsedMessage.systemPrompt || SYSTEM_PROMPT_TEXT_CORE;
            const clientRequestedVoice = parsedMessage.voice || "Kore"; 
            const clientRequestedTemp = parseFloat(parsedMessage.temperature) || 0.8;

            if (!GEMINI_API_KEY) { 
                console.error('[ServerGoogleWS] Cannot connect to Gemini: API key missing.');
                if (wsClient.readyState === WebSocket.OPEN) {
                    wsClient.send(JSON.stringify({ type: 'error', data: 'Gemini API key not configured on server.' }));
                }
                return; 
            }
            
            const modelForGoogle = 'models/gemini-2.5-flash-preview-native-audio-dialog';
            const googleWsUrl = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';
            
            console.log(`[ServerGoogleWS] Attempting to connect to Google Live API at ${googleWsUrl} with model ${modelForGoogle}`);
            googleWs = new WebSocket(googleWsUrl, { headers: { 'x-goog-api-key': GEMINI_API_KEY } });

            googleWs.onopen = () => { 
                console.log('[ServerGoogleWS] Connection to Google Live API established.');
                const generationConfig = { responseModalities: ["AUDIO"], temperature: Math.min(Math.max(clientRequestedTemp, 0.0), 2.0), speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voice_name: clientRequestedVoice } } } };
                const setupMessagePayload = { model: modelForGoogle, systemInstruction: { parts: [{ text: currentSystemPrompt }] }, generationConfig: generationConfig, outputAudioTranscription: {} };
                const setupMessage = { setup: setupMessagePayload };
                console.log('[ServerGoogleWS] Sending BidiGenerateContentSetup to Google:', JSON.stringify(setupMessage, null, 2));
                googleWs.send(JSON.stringify(setupMessage));
            };

            googleWs.onmessage = (event) => {
                const googleMsgString = event.data.toString();
                try {
                    const googleMsg = JSON.parse(googleMsgString);
                    if (googleMsg.setupComplete) { 
                        console.log('[ServerGoogleWS] Google Live API setup complete.');
                        isGoogleSessionSetupComplete = true;
                        if (wsClient.readyState === WebSocket.OPEN) wsClient.send(JSON.stringify({ type: 'status', data: 'Gemini session initialized' }));
                    } else if (googleMsg.serverContent) {
                        let modelTextOutput = null; 
                        let audioTranscript = null; 
                        let aiSaidTextForLog = null; 

                        if (googleMsg.serverContent.modelTurn && googleMsg.serverContent.modelTurn.parts) {
                            const textPart = googleMsg.serverContent.modelTurn.parts.find(p => p.text);
                            if (textPart && textPart.text) {
                                modelTextOutput = textPart.text;
                                console.log('[ServerGoogleWS] Google Text (from modelTurn):', modelTextOutput);
                                if (wsClient.readyState === WebSocket.OPEN) {
                                    wsClient.send(JSON.stringify({ type: 'text', data: modelTextOutput }));
                                }
                            }
                            const audioPart = googleMsg.serverContent.modelTurn.parts.find(p => p.inlineData && p.inlineData.mimeType && p.inlineData.mimeType.startsWith('audio/pcm'));
                            if (audioPart && audioPart.inlineData.data && wsClient.readyState === WebSocket.OPEN) {
                                console.log('[ServerGoogleWS] Google Audio (base64 length):', audioPart.inlineData.data.length);
                                wsClient.send(JSON.stringify({ type: 'audio_base64_pcm_24k', data: audioPart.inlineData.data }));
                            }
                        }

                        if (googleMsg.serverContent.outputTranscription && googleMsg.serverContent.outputTranscription.text) {
                            audioTranscript = googleMsg.serverContent.outputTranscription.text;
                            console.log('[ServerGoogleWS] Google Transcript (from outputTranscription):', audioTranscript);
                            if (audioTranscript && audioTranscript !== modelTextOutput && wsClient.readyState === WebSocket.OPEN) {
                                wsClient.send(JSON.stringify({ type: 'text', data: `[Transcript: ${audioTranscript}]` }));
                            }
                        }

                        if (modelTextOutput) {
                            aiSaidTextForLog = modelTextOutput;
                        } else if (audioTranscript) {
                            aiSaidTextForLog = audioTranscript; 
                        }

                        if (aiSaidTextForLog) { // Accumulate parts of the AI's response
                            currentAiResponseBuffer += aiSaidTextForLog + " "; // Add space between parts
                        }
                        
                        if (googleMsg.serverContent.generationComplete) {
                            console.log('[ServerGoogleWS] Google generation complete for this turn.');
                            if (currentAiResponseBuffer.trim().length > 0) {
                                try { 
                                    fs.appendFileSync(transcriptFilePath, `McCoy: ${currentAiResponseBuffer.trim()}\n\n`); 
                                    console.log(`[Transcript] Appended AI full response: ${currentAiResponseBuffer.trim().substring(0,50)}...`);
                                } catch (e) { 
                                    console.error("Transcript append error for AI full response:", e); 
                                }
                            }
                            currentAiResponseBuffer = ""; 
                            if (wsClient.readyState === WebSocket.OPEN) {
                                wsClient.send(JSON.stringify({ type: 'generation_complete' }));
                            }
                        }
                    }
                } catch (e) { console.error('[ServerGoogleWS] Error parsing message from Google:', e, googleMsgString); }
            };
            googleWs.onerror = (error) => { 
                console.error('[ServerGoogleWS] Error on WebSocket connection to Google Live API:', error.message);
                isGoogleSessionSetupComplete = false;
                if (wsClient.readyState === WebSocket.OPEN) wsClient.send(JSON.stringify({ type: 'error', data: `Google WebSocket error: ${error.message}` }));
                if (googleWs) googleWs.terminate(); googleWs = null;
            };
            googleWs.onclose = (event) => { 
                console.log('[ServerGoogleWS] WebSocket connection to Google Live API closed:', event.code, event.reason);
                isGoogleSessionSetupComplete = false;
                if (wsClient.readyState === WebSocket.OPEN) wsClient.send(JSON.stringify({ type: 'status', data: `Gemini session with Google closed. Code: ${event.code}` }));
                googleWs = null;
            };

        } else if (parsedMessage.type === 'user_audio_chunk_webm') { 
            if (googleWs && googleWs.readyState === WebSocket.OPEN && isGoogleSessionSetupComplete) {
                const audioDataSizeKB = parsedMessage.data ? (parsedMessage.data.length * 3/4 / 1024).toFixed(1) : '0';
                try { fs.appendFileSync(transcriptFilePath, `User: [Audio Input - ${audioDataSizeKB}KB WebM]\n\n`); } catch (e) { console.error("Transcript append error for User Audio:", e); }
                try {
                    const inputBuffer = Buffer.from(parsedMessage.data, 'base64'); 
                    const tempInputWebm = path.join(__dirname, `temp_client_audio_${Date.now()}.webm`);
                    const tempOutputPcm = path.join(__dirname, `temp_client_audio_${Date.now()}.pcm`);
                    fs.writeFileSync(tempInputWebm, inputBuffer);
                    await new Promise((resolve, reject) => { 
                        ffmpeg(tempInputWebm).audioFrequency(16000).audioChannels(1).toFormat('s16le')
                        .on('start', cmdLine => console.log('[FFmpeg] Started:', cmdLine))
                        .on('error', (err, stdout, stderr) => { console.error('[FFmpeg] Err:', err.message, stdout, stderr); reject(err); })
                        .on('end', () => { console.log('[FFmpeg] PCM conversion done.'); resolve(); })
                        .save(tempOutputPcm);
                    });
                    const pcmBuffer = fs.readFileSync(tempOutputPcm);
                    const pcmBase64 = pcmBuffer.toString('base64');
                    const googleAudioMessage = { realtimeInput: { audio: { mimeType: "audio/pcm;rate=16000", data: pcmBase64 }}};
                    googleWs.send(JSON.stringify(googleAudioMessage));
                    console.log('[ServerUserAudio] Sent converted PCM to Google. Length:', pcmBase64.length);
                    try { fs.unlinkSync(tempInputWebm); } catch (e) { /* ignore */ }
                    try { fs.unlinkSync(tempOutputPcm); } catch (e) { /* ignore */ }
                } catch (conversionError) { 
                    console.error('[ServerUserAudio] Conversion/Send Error:', conversionError);
                    if (wsClient.readyState === WebSocket.OPEN) wsClient.send(JSON.stringify({ type: 'error', data: 'Server audio conversion error.' }));
                }
            } else { 
                console.warn('[ServerUserAudio] Audio received but Google session not ready.');
                if (wsClient.readyState === WebSocket.OPEN) wsClient.send(JSON.stringify({ type: 'error', data: 'Google session not ready for audio.' }));
            }
        } else if (parsedMessage.type === 'user_text_input') {
            if (googleWs && googleWs.readyState === WebSocket.OPEN && isGoogleSessionSetupComplete) {
                try { fs.appendFileSync(transcriptFilePath, `User: ${parsedMessage.text}\n\n`); } catch (e) { console.error("Transcript append error for User Text:", e); }
                const clientContentMessage = { clientContent: { turns: [{ role: "user", parts: [{ text: parsedMessage.text }] }], turnComplete: true }};
                googleWs.send(JSON.stringify(clientContentMessage));
            } else { 
                console.warn('[ServerUserText] Text received but Google session not ready.');
                if (wsClient.readyState === WebSocket.OPEN) wsClient.send(JSON.stringify({ type: 'error', data: 'Google session not ready for text.' }));
            }
        }
    });

    wsClient.on('close', () => {
        console.log('[ServerWS] Client disconnected.');
        if (currentAiResponseBuffer.trim().length > 0) {
             try { 
                fs.appendFileSync(transcriptFilePath, `McCoy: ${currentAiResponseBuffer.trim()} [incomplete turn?]\n\n`); 
                console.log(`[Transcript] Appended remaining AI buffer on close: ${currentAiResponseBuffer.trim().substring(0,50)}...`);
            } catch (e) { 
                console.error("Transcript append error for AI buffer on close:", e); 
            }
            currentAiResponseBuffer = "";
        }
        try {
            fs.appendFileSync(transcriptFilePath, `------------------------------------------\nSession Ended: ${new Date().toISOString()}\n\n`);
        } catch (err) { console.error(`[ServerWS] Error writing final transcript footer: ${err}`); }
        if (googleWs) { googleWs.terminate(); googleWs = null; }
    });

    wsClient.on('error', (error) => { 
        console.error('[ServerWS] Client WebSocket error:', error);
        if (googleWs) { googleWs.terminate(); googleWs = null; console.log('[ServerGoogleWS] Terminated Google connection due to client error.');}
    });
});

console.log('[ServerSetup] Attempting to start server...');
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`[ServerSetup] ERROR: Port ${PORT} is already in use. Please close the other application or choose a different port.`);
    } else {
        console.error('[ServerSetup] ERROR starting server:', error);
    }
    process.exit(1); // Exit if server can't start
});

server.listen(PORT, () => {
    console.log(`Node.js server running on http://localhost:${PORT}`);
    console.log(`WebSocket server available at ws://localhost:${PORT}`);
});

export { app, server };
