document.addEventListener('DOMContentLoaded', () => {
    const voiceOrb = document.getElementById('voice-orb'); 
    const stopButton = document.getElementById('stop-button');
    const conversationArea = document.getElementById('conversation-area');
    const textInput = document.getElementById('text-input'); 
    const sendTextButton = document.getElementById('send-text-button'); 

    let mediaRecorder;
    let audioChunks = [];
    let webSocket;
    
    let audioContext; 
    let pcmPlayerNode = null;

    const WS_URL = 'ws://localhost:3000'; 

    const SYSTEM_PROMPT_TEXT_FOR_CONFIG = `
## RULES
1. REMEMBER, this is a voice message convo with a highschooler... KEEP IT SHORT
2. speak informally and be friendly and helpful, like a good career coach from an urban area is.  
3. this is a voice convo, so keep it short.  
4. Avoid trying too hard, just be authentic and humble and chill.  say umm.. and uhh.. and stuff like that, to seem more like a regular young chill coach. always be encouraging and follow coaching principles associated with coaching students.  When appropriate, refer to the competency definitions listed below, as they represent our core impact program at TPZ.
5. use emojis that young hip gen z coach would use. keep it short.

## ROLE
You are McCoy, a TPZ advisor, and you job is to help the user reflect on how their  journey is going at The Possible Zone (TPZ).  You are talking to a high school student in a quick voice chat, who you'll keep coaching and guiding through their journey.  REMEMBER, this is a voice convo with a highschooler... KEEP IT SHORT.

## WORKFLOW
The student will have you running all the time and can ask you questions or just engage in general reflection and chat with you about their work at The Possible Zone (details about The Possible Zone below), and also how their preparation is going for their work outside the possible zone.  Start by asking them where they are in their entrepreneurship journey so far at TPZ.

## YOUR FIRST CHAT
The first time you chat with a student, Ask them for their student ID, and keep this in mind.  DO NOT advance till you get this number.  only continue the conversation once you do, this is to make sure we can guide the student the best we can by really tailoring things to them.  Then, ak what their name, and pronouns so you can continue (and say yours, making a techy AI joke like an urban coach would ha! .. then, take some time to get to know their interests, etc, like any good coach or teacher would.  This is to build relationship with them and get a vibe going, and also so you can adapt to their interests and follow their vibe.  IMPORTANT: Only after you'e taken FOUR turns with this do you start talking about TPZ.

## THE POSSIBLE ZONE PROGRAM MODEL 
TPZ is a youth development program that focuses on helping students discover their entrepreneurial spirit and develop positive identity around careers in STEAM, with the ultimate outcome being economic mobility for our students.  At TPZ, students first do a semester of DISCOVER, where they get introduced to the tools in our fablab and facilities.  then they do a semester of EXPLORE, where they deepen their understanding of a certain area of the facility where they want to develop a product.  After that, they get a semester of CREATE, where they are iterating on their prototype till they finally present it in our marketplace at the end of the term.  At the same time, students can sign up for DEEP DIVES during school breaks, where they are immersed in week-long intensives that develop specific STEAM skills (they can choose to do a robotics Deep Dive, a Clean Energy Deep Dive, a fashion and apparel Deep Dive, or a coding and game design deep dive.)

## COMPETENCY DEFINITIONS
Competency 1: Sense of Belonging
Working Definition: Feeling connected to a learning community or professional setting, and accepted and valued by peers and adults in it.
Reporting Dimensions:

Competency 2: Growth Mindset
Working Definition: The belief that one's abilities can grow with effort and intentionality.

Competency 3: STEAM Interest
Working Definition: Exploration of one's identity through STEAM, both in and out of class

Competency 4: Creativity
Working Definition: Ability to combine resources, generate new ideas, or adapt existing ones to achieve goals

Competency 5: Communication
Working Definition: Ability to clearly exchange information with others in various settings and for various purposes

Competency 6: Teamwork
Working Definition: Ability to work cooperatively with diverse peers and adults to achieve shared goals

Competency 7: Adaptability
Working Definition: Ability to adjust emotions, thoughts, and behaviors in response to change or uncertainty

Competency 8: Problem-Solving
Working Definition: Ability to identify, understand, and solve challenges effectively

Competency 9: STEAM Agency
Working Definition: Feeling capable of engaging with STEAM tools and technology effectively and responsibly

Competency 10: Self-Efficacy
Working Definition: Confidence in one's ability to succeed through effort and skill

Competency 11: Persistence
Working Definition: Seeking and utilizing resources to sustain effort in the face of challenges, while maintaining an improvement orientation

Competency 12: Opportunity Recognition
Working Definition: Ability to identify and act on opportunities for learning, improvement, or advancement

Competency 13: Continuous Learning
Working Definition: Ongoing process of seeking new skills and knowledge, using reflection and feedback to improve

Competency 14: Social Capital
Working Definition: The extent to which one builds and leverages a network of connections to achieve goals

### PROGRAM OFFERINGS:
## DISCOVER (1 term)
Students get familiar with their new Zone... TPZ!  Through fun hands on projects, they learn about various facilities at TPZ, from 2D/3D design, coding and electronics, fiber arts, music production studio, or podcasting studio with the STEAM team.  All the while, they are introduced to TPZ's competencies and begin to practice reflecting on their growth while getting to know their the team and their new community at TPZ.

## EXPLORE (up to 2 terms)
In this phase, students explore up to two chosen zones more deeply, one term each.  This is when they really iterate on these methods and tools they were introduced to in Discover, and become more familiar and comfortable with using them to make their ideas come to life.

## CREATE (up to 3 terms)
In this phase, students develop a business idea, informed by their experiences in DISCOVER and EXPLORE (by now, they would have gotten some specialized skills in one of the STEAM methods and tools at TPZ as well as having more entrepreneurship competencies).

## OTHER OPPORTUNITIES
throughout their time at TPZ, students also can sign up for STEAM DEEP DIVES (the STEAM elective intensives that run during school break weeks to deepen skill in each zone even more), as well as OPEN STUDIO (where students get to do passion projects supported by mentors), and COLLEGE AND CAREER PATHWAYS BOOTCAMPS, where they learn about opportunities to get internship, college admission, and/or job credentials in the area they are specializing in.  Finally, students can also work with TPZ VENTURES, a real business accelerator at our innovation center, which incubates businesses of local post-high school youth from the community.

## TONE
Don't talk formally.  Remember, you're talking to a high school student from the inner city in Boston.  Use language that a hip coach would use, but keep it professional at the same time.  Talk like a young professional african american creative would talk if he was talking to a high school student.  Avoid trying too hard, just be authentic and humble and chill.  say umm.. and uhh.. and stuff like that, to seem more like a regular young chill coach.
REMEMBER, this is a voice  convo with a highschooler... KEEP IT SHORT.

Introduce yourself by saying your name is Elijah McCoy, but that the user can call you Eli, or McCoy, whatever they prefer.  
`;

    async function initializeAudioSystem() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
            console.log('[AudioSystem] AudioContext created. Initial state:', audioContext.state, 'Sample rate:', audioContext.sampleRate);
        }

        if (audioContext.state === 'suspended') {
            await audioContext.resume();
            console.log('[AudioSystem] AudioContext resumed.');
        }

        if (!pcmPlayerNode && audioContext.audioWorklet) {
            try {
                await audioContext.audioWorklet.addModule('/static/audio-player-processor.js'); 
                pcmPlayerNode = new AudioWorkletNode(audioContext, 'pcm-player-processor');
                pcmPlayerNode.connect(audioContext.destination);
                console.log('[AudioSystem] PCMPlayerProcessor AudioWorkletNode created and connected.');
            } catch (e) {
                console.error('[AudioSystem] Error loading or creating AudioWorkletNode:', e);
                addMessageToConversation('Error initializing audio player. Playback may fail.', 'system');
            }
        } else if (!audioContext.audioWorklet) {
            console.error('[AudioSystem] AudioWorklet API not supported by this browser.');
            addMessageToConversation('AudioWorklet not supported. Playback may fail or be disabled.', 'system');
        }
        return audioContext;
    }

    function addMessageToConversation(message, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add(sender === 'user' ? 'user-message' : 'ai-message');
        if (sender === 'ai-system') {
            messageDiv.classList.add('ai-message', 'system-status');
        }
        messageDiv.textContent = message;
        conversationArea.appendChild(messageDiv);
        conversationArea.scrollTop = conversationArea.scrollHeight;
    }
    
    async function handleReceivedAudio(base64PcmData) { 
        const ctx = await initializeAudioSystem(); 
        if (!ctx || !pcmPlayerNode) {
            console.error("[AudioPlayer] AudioContext or PCMPlayerNode not available in handleReceivedAudio.");
            addMessageToConversation("Cannot play audio: Audio system error.", "system");
            voiceOrb.classList.remove('speaking');
            return;
        }
        
        if (!voiceOrb.classList.contains('speaking')) { // Check before adding, if not already added by onmessage
            addMessageToConversation("AI is speaking...", "ai-system");
            voiceOrb.classList.add('speaking');
        }

        try {
            const binaryString = window.atob(base64PcmData);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const int16Array = new Int16Array(bytes.buffer);
            const float32Array = new Float32Array(int16Array.length);
            for (let i = 0; i < int16Array.length; i++) {
                float32Array[i] = int16Array[i] / 32768.0;
            }
            
            pcmPlayerNode.port.postMessage(float32Array);
        } catch (e) {
            console.error("[AudioPlayer] Error processing received PCM audio for worklet:", e);
            addMessageToConversation("Error processing AI audio for playback.", "system");
            voiceOrb.classList.remove('speaking');
        }
    }

    function sendTextMessage() {
        const text = textInput.value.trim();
        if (text && webSocket && webSocket.readyState === WebSocket.OPEN) {
            webSocket.send(JSON.stringify({
                type: 'user_text_input',
                text: text
            }));
            addMessageToConversation(text, 'user');
            textInput.value = ''; 
        } else if (!text) {
            // Silent if empty
        } else {
            addMessageToConversation('Cannot send text. Not connected.', 'system');
        }
    }

    async function connectWebSocket() {
        await initializeAudioSystem(); 

        webSocket = new WebSocket(WS_URL);

        webSocket.onopen = () => {
            console.log('WebSocket connection established with Node.js server.');
            addMessageToConversation('Connected to advisor service.', 'system');
            voiceOrb.classList.remove('recording', 'speaking'); 
            voiceOrb.style.cursor = 'pointer';
            stopButton.style.display = 'none'; 
            sendTextButton.disabled = false; 
            textInput.disabled = false; 
            
            const configMessage = {
                type: 'gemini_config',
                systemPrompt: SYSTEM_PROMPT_TEXT_FOR_CONFIG,
                voice: "Charon", 
                temperature: 1.2
            };
            webSocket.send(JSON.stringify(configMessage));
            console.log('Sent gemini_config to server.');
        };

        webSocket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'text') {
                    addMessageToConversation(message.data, 'ai');
                } else if (message.type === 'audio_base64_pcm_24k') {
                    if (!voiceOrb.classList.contains('speaking')) { 
                        addMessageToConversation("AI is speaking...", "ai-system");
                        voiceOrb.classList.add('speaking');
                    }
                    handleReceivedAudio(message.data); 
                } else if (message.type === 'status') {
                    addMessageToConversation(`Server status: ${message.data}`, 'system');
                } else if (message.type === 'error') {
                    addMessageToConversation(`Server error: ${message.data}`, 'system');
                    console.error('Server error:', message.data);
                    voiceOrb.classList.remove('speaking', 'recording');
                } else if (message.type === 'generation_complete') {
                    addMessageToConversation('AI finished responding for this turn.', 'ai-system');
                    voiceOrb.classList.remove('speaking'); 
                }
            } catch (e) {
                console.error('Error parsing message or unknown message format:', event.data, e);
                addMessageToConversation('Received unparsed data: ' + event.data, 'system');
                voiceOrb.classList.remove('speaking', 'recording');
            }
        };

        webSocket.onclose = () => {
            console.log('WebSocket connection closed.');
            addMessageToConversation('Disconnected from advisor service.', 'system');
            voiceOrb.classList.remove('recording', 'speaking');
            voiceOrb.style.cursor = 'not-allowed'; 
            stopButton.style.display = 'none';
            sendTextButton.disabled = true; 
            textInput.disabled = true; 
        };

        webSocket.onerror = (error) => {
            console.error('WebSocket error:', error);
            addMessageToConversation('Error connecting. Check console & server.', 'system');
            voiceOrb.classList.remove('recording', 'speaking');
            voiceOrb.style.cursor = 'pointer'; 
            stopButton.style.display = 'none';
            sendTextButton.disabled = true; 
            textInput.disabled = true;
        };
    }

    voiceOrb.addEventListener('click', async () => { 
        if (voiceOrb.classList.contains('recording')) { 
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                console.log('[UserAudio] Orb clicked while recording: Stopping MediaRecorder.');
                mediaRecorder.stop();
            }
            // Visual state updates are handled in onstop or stopButton.click
            return;
        }

        console.log('[UserAudio] Orb clicked: Initializing audio system for recording.');
        await initializeAudioSystem(); 
        
        if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
            addMessageToConversation('Connecting to service...', 'system');
            voiceOrb.style.cursor = 'wait';
            sendTextButton.disabled = true;
            textInput.disabled = true;
            connectWebSocket(); 
            return; 
        }
        
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                console.log('[UserAudio] Microphone access granted.');
                const options = { mimeType: 'audio/webm;codecs=opus' }; 
                try {
                    mediaRecorder = new MediaRecorder(stream, options);
                    console.log('[UserAudio] MediaRecorder created with mimeType:', mediaRecorder.mimeType);
                } catch (e) {
                    console.warn("[UserAudio] Preferred mimeType not supported, using default.", e);
                    mediaRecorder = new MediaRecorder(stream);
                    console.log('[UserAudio] MediaRecorder created with default mimeType:', mediaRecorder.mimeType);
                }
                
                audioChunks = [];
                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        audioChunks.push(event.data);
                        console.log(`[UserAudio] Data available, chunk size: ${event.data.size}, total chunks: ${audioChunks.length}`);
                    } else {
                        console.log('[UserAudio] Data available but size is 0.');
                    }
                };

                mediaRecorder.onstop = () => {
                    console.log('[UserAudio] MediaRecorder stopped.');
                    voiceOrb.classList.remove('recording');
                    voiceOrb.style.cursor = 'pointer';
                    stopButton.style.display = 'none';
                    textInput.disabled = false; 
                    sendTextButton.disabled = false;

                    if (audioChunks.length === 0) {
                        console.log("[UserAudio] No audio data recorded.");
                        addMessageToConversation('No audio recorded.', 'system');
                        return;
                    }
                    const audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType });
                    console.log('[UserAudio] audioBlob created. Size:', audioBlob.size, 'Type:', audioBlob.type);
                    
                    if (webSocket && webSocket.readyState === WebSocket.OPEN) {
                        const reader = new FileReader();
                        reader.onloadend = function() {
                            const base64String = reader.result.split(',')[1];
                            console.log('[UserAudio] Sending user_audio_chunk_webm. Base64 data length (approx):', base64String.length);
                            webSocket.send(JSON.stringify({
                                type: 'user_audio_chunk_webm', 
                                data: base64String 
                            }));
                            addMessageToConversation('You (audio sent)', 'user');
                        };
                        reader.readAsDataURL(audioBlob); 
                    } else {
                        addMessageToConversation('Not connected. Please try recording again.', 'system');
                    }
                    stream.getTracks().forEach(track => track.stop());
                    console.log('[UserAudio] Microphone stream tracks stopped.');
                };
                
                // Start recording with a timeslice to get data more frequently if needed for debugging,
                // but for now, we send the whole chunk on stop.
                // mediaRecorder.start(1000); // Example: event every 1 second
                mediaRecorder.start();
                console.log('[UserAudio] MediaRecorder started.');
                voiceOrb.classList.add('recording');
                voiceOrb.classList.remove('speaking'); 
                stopButton.style.display = 'inline-block'; 
                textInput.disabled = true; 
                sendTextButton.disabled = true;
                addMessageToConversation('Recording... Speak now!', 'system');

            } catch (err) {
                console.error('[UserAudio] Error accessing microphone or starting recording:', err);
                addMessageToConversation('Mic error. Check permissions.', 'system');
                voiceOrb.classList.remove('recording');
                voiceOrb.style.cursor = 'pointer';
                stopButton.style.display = 'none';
                textInput.disabled = false; 
                sendTextButton.disabled = false;
            }
        } else {
            addMessageToConversation('getUserMedia not supported.', 'system');
        }
    });

    stopButton.addEventListener('click', () => {
        console.log('[UserAudio] Stop button clicked.');
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop(); 
        }
        voiceOrb.classList.remove('recording');
        voiceOrb.style.cursor = 'pointer';
        stopButton.style.display = 'none';
        textInput.disabled = false; 
        sendTextButton.disabled = false;
        // addMessageToConversation('Recording stopped by button.', 'system'); // onstop handles "sending" message
    });

    sendTextButton.addEventListener('click', sendTextMessage);
    textInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendTextMessage();
        }
    });

    initializeAudioSystem().then(() => {
        console.log("Initial audio system check complete.");
        voiceOrb.style.cursor = 'pointer';
        stopButton.style.display = 'none';
        sendTextButton.disabled = true; 
        textInput.disabled = true; 
    }).catch(err => {
        console.error("Initial audio system initialization failed:", err);
        addMessageToConversation("Audio system failed to initialize. Playback may not work.", "system");
    });
});
