````markdown
# Gemini Live API: Comprehensive Reference Guide

This document provides a comprehensive reference for the Google Gemini Live API, designed to guide developers and agentic LLMs in successfully utilizing its capabilities for real-time, multimodal interactions.

## Table of Contents

1.  [Introduction](#introduction)
    *   [What is the Live API?](#what-is-the-live-api)
    *   [Key Features](#key-features)
2.  [Core Concepts](#core-concepts)
    *   [Streaming Model](#streaming-model)
    *   [WebSocket Connection](#websocket-connection)
    *   [Output Generation Methods](#output-generation-methods)
        *   [Half Cascade](#half-cascade)
        *   [Native Audio Output](#native-audio-output)
3.  [Getting Started](#getting-started)
    *   [Prerequisites](#prerequisites)
    *   [API Key Warning](#api-key-warning)
    *   [Establishing a Connection](#establishing-a-connection)
4.  [Interacting with the API](#interacting-with-the-api)
    *   [Sending and Receiving Text](#sending-and-receiving-text)
    *   [Sending and Receiving Audio](#sending-and-receiving-audio)
        *   [Audio Formats](#audio-formats)
        *   [Sending Audio Example](#sending-audio-example)
        *   [Receiving Audio Example](#receiving-audio-example)
    *   [Receiving Audio Transcriptions](#receiving-audio-transcriptions)
        *   [Output Audio Transcription](#output-audio-transcription)
        *   [Input Audio Transcription](#input-audio-transcription)
    *   [Streaming Audio and Video](#streaming-audio-and-video)
5.  [Session Configuration](#session-configuration)
    *   [System Instructions](#system-instructions)
    *   [Incremental Content Updates](#incremental-content-updates)
    *   [Changing Voice and Language](#changing-voice-and-language)
        *   [Specifying Voice](#specifying-voice)
        *   [Changing Language](#changing-language)
6.  [Native Audio Output Features](#native-audio-output-features)
    *   [Supported Models](#supported-models)
    *   [Using Native Audio Output](#using-native-audio-output)
    *   [Affective Dialog](#affective-dialog)
    *   [Proactive Audio](#proactive-audio)
    *   [Native Audio Output with Thinking](#native-audio-output-with-thinking)
7.  [Tool Use with Live API](#tool-use-with-live-api)
    *   [Overview of Supported Tools](#overview-of-supported-tools)
    *   [Function Calling](#function-calling)
        *   [Asynchronous Function Calling](#asynchronous-function-calling)
    *   [Code Execution](#code-execution)
    *   [Grounding with Google Search](#grounding-with-google-search)
    *   [Combining Multiple Tools](#combining-multiple-tools)
8.  [Session Control and Management](#session-control-and-management)
    *   [Handling Interruptions](#handling-interruptions)
    *   [Voice Activity Detection (VAD)](#voice-activity-detection-vad)
        *   [Using Automatic VAD](#using-automatic-vad)
        *   [Configuring Automatic VAD](#configuring-automatic-vad)
        *   [Disabling Automatic VAD (Manual Control)](#disabling-automatic-vad-manual-control)
    *   [Token Count](#token-count)
    *   [Extending Session Duration](#extending-session-duration)
        *   [Context Window Compression](#context-window-compression)
        *   [Session Resumption](#session-resumption)
    *   [GoAway Message (Disconnection Warning)](#goaway-message-disconnection-warning)
    *   [Generation Complete Message](#generation-complete-message)
9.  [Media Resolution](#media-resolution)
10. [Limitations](#limitations)
    *   [Response Modalities](#response-modalities)
    *   [Client Authentication](#client-authentication)
    *   [Session Duration](#session-duration)
    *   [Context Window](#context-window)
    *   [Supported Languages](#supported-languages)
11. [Third-Party Integrations](#third-party-integrations)
12. [Further Resources](#further-resources)

---

## 1. Introduction

### What is the Live API?
The Gemini Live API enables low-latency, bidirectional voice and video interactions with Gemini models. It allows for natural, human-like voice conversations by streaming input (audio, video, text) continuously to the model and receiving the model's response (text or audio) in real-time over a persistent WebSocket connection.

### Key Features
-   **Low-Latency Interaction**: Designed for responsive, real-time conversations.
-   **Bidirectional Streaming**: Continuous data flow for both input and output.
-   **Multimodal Input**: Supports text, audio, and video inputs.
-   **Real-time Output**: Generates text or audio responses as data is processed.
-   **Voice Activity Detection (VAD)**: Automatically detects speech for natural turn-taking.
-   **Tool Usage**: Supports function calling, code execution, and Google Search.
-   **Advanced Audio Features**: Native audio generation for more natural and expressive voices.

---

## 2. Core Concepts

### Streaming Model
The Live API utilizes a streaming model over a WebSocket connection. This means:
-   A persistent connection is established between the client and the API.
-   Input (audio, video, text) is sent as a continuous stream.
-   Output (text, audio) is received as a continuous stream.
-   This approach minimizes latency and supports dynamic interaction.

### WebSocket Connection
All interactions with the Live API occur over a WebSocket connection. This protocol is well-suited for real-time, full-duplex communication.

### Output Generation Methods
The Live API can generate audio output using one of two methods, depending on the model version:

#### Half Cascade
-   The model receives native audio input.
-   A specialized cascade of distinct models processes the input and generates audio output.
-   Example model: `gemini-2.0-flash-live-001`

#### Native Audio Output
-   Introduced with Gemini 2.5 models.
-   Directly generates audio output from the primary model.
-   Provides more natural-sounding audio, expressive voices, better contextual awareness (e.g., tone), and more proactive responses.
-   Example models: `gemini-2.5-flash-preview-native-audio-dialog`, `gemini-2.5-flash-exp-native-audio-thinking-dialog`.
-   Default model (always preferred): `gemini-2.5-flash-preview-native-audio-dialog`.

---

## 3. Getting Started

### Prerequisites
Ensure you have the Google Generative AI SDK installed:
```bash
pip install google-generativeai
````

### API Key Warning

__Critical__: It is unsafe to embed your API key directly into client-side JavaScript or TypeScript code. For production applications, always use server-side deployments to interact with the Live API.

### Establishing a Connection

A connection is established using the `genai.Client`.

__Python Example:__

```python
import asyncio
from google import genai

# Replace with your actual API key
GEMINI_API_KEY = "YOUR_GEMINI_API_KEY"

client = genai.Client(api_key=GEMINI_API_KEY)
model_name = "gemini-2.0-flash-live-001" # Or a native audio model

# Configuration: Specify response modality (TEXT or AUDIO, not both)
config = {"response_modalities": ["TEXT"]} # For text responses

async def main():
    try:
        async with client.aio.live.connect(model=model_name, config=config) as session:
            print("Session started successfully.")
            # Further interaction logic here
            # For example, sending a message:
            # await session.send_client_content(
            #     turns={"role": "user", "parts": [{"text": "Hello, Gemini!"}]},
            #     turn_complete=True
            # )
            # async for response in session.receive():
            #     if response.text is not None:
            #         print(response.text, end="")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    asyncio.run(main())
```

__Note__: You can only set one modality (`TEXT` or `AUDIO`) in the `response_modalities` field per session.

---

## 4. Interacting with the API

### Sending and Receiving Text

__Python Example:__

```python
import asyncio
from google import genai

client = genai.Client(api_key="YOUR_GEMINI_API_KEY")
model_name = "gemini-2.0-flash-live-001"
config = {"response_modalities": ["TEXT"]}

async def text_interaction():
    async with client.aio.live.connect(model=model_name, config=config) as session:
        message = "Hello, how are you?"
        print(f"User: {message}")
        await session.send_client_content(
            turns={"role": "user", "parts": [{"text": message}]},
            turn_complete=True  # Indicates this is a complete turn
        )

        print("Gemini: ", end="")
        async for response in session.receive():
            if response.text is not None:
                print(response.text, end="")
            if response.server_content and response.server_content.generation_complete:
                print("\nGeneration complete.")
                break # Exit loop once generation is complete for this turn
        print("\nSession ended.")

if __name__ == "__main__":
    asyncio.run(text_interaction())
```

### Sending and Receiving Audio

#### Audio Formats

- __Input Audio__:

  - Format: Raw, little-endian, 16-bit PCM.
  - Native Sample Rate: 16kHz.
  - The API can resample other input rates, but 16kHz is optimal.
  - MIME type: `audio/pcm;rate=<sample_rate>` (e.g., `audio/pcm;rate=16000`).

- __Output Audio__:

  - Format: Raw, little-endian, 16-bit PCM.
  - Sample Rate: Always 24kHz.
  - Channels: Mono.

#### Sending Audio Example

This example reads a WAV file, converts it to the required PCM format, and sends it.

```python
import asyncio
import io
from pathlib import Path
from google import genai
from google.genai import types
import soundfile as sf # pip install soundfile
import librosa # pip install librosa

client = genai.Client(api_key="YOUR_GEMINI_API_KEY")
model_name = "gemini-2.0-flash-live-001"
# For audio input, the model can still respond with text if configured
config = {"response_modalities": ["TEXT"]}

# Ensure you have a sample.wav file or replace with your audio file
# A 16kHz mono WAV file is ideal to minimize conversion
AUDIO_FILE_PATH = "sample.wav" # Create or replace with your WAV file path

async def send_audio_input():
    if not Path(AUDIO_FILE_PATH).exists():
        print(f"Audio file not found: {AUDIO_FILE_PATH}")
        # Create a dummy silent WAV file for testing if it doesn't exist
        dummy_sr = 16000
        dummy_duration = 1 # seconds
        dummy_data = librosa.tone(frequency=1, sr=dummy_sr, duration=dummy_duration) * 0 # silent
        sf.write(AUDIO_FILE_PATH, dummy_data, dummy_sr)
        print(f"Created a dummy silent WAV file: {AUDIO_FILE_PATH}")


    async with client.aio.live.connect(model=model_name, config=config) as session:
        buffer = io.BytesIO()
        # Load audio, resample to 16kHz if necessary
        y, sr = librosa.load(AUDIO_FILE_PATH, sr=16000, mono=True)
        # Write as RAW PCM 16-bit
        sf.write(buffer, y, sr, format='RAW', subtype='PCM_16')
        buffer.seek(0)
        audio_bytes = buffer.read()

        print("Sending audio input...")
        # If using automatic VAD (default), just send audio
        # If manual VAD, send activity_start first
        # await session.send_realtime_input(activity_start=types.ActivityStart()) # If manual VAD
        await session.send_realtime_input(
            audio=types.Blob(data=audio_bytes, mime_type="audio/pcm;rate=16000")
        )
        # If manual VAD, send activity_end after audio
        # await session.send_realtime_input(activity_end=types.ActivityEnd()) # If manual VAD

        print("Receiving response...")
        async for response in session.receive():
            if response.text is not None:
                print(f"Model Text Response: {response.text}")
            if response.server_content and response.server_content.generation_complete:
                print("Generation complete.")
                break
        print("Audio sending example finished.")

if __name__ == "__main__":
    asyncio.run(send_audio_input())
```

#### Receiving Audio Example

This example sends a text message and receives an audio response, saving it as a WAV file.

```python
import asyncio
import wave
from google import genai
from google.genai import types

client = genai.Client(api_key="YOUR_GEMINI_API_KEY")
# Use a model that supports native audio output for better quality if available
model_name = "gemini-2.5-flash-preview-native-audio-dialog" # or "gemini-2.0-flash-live-001"
config = {"response_modalities": ["AUDIO"]} # Configure for audio response

OUTPUT_WAV_FILE = "received_audio.wav"

async def receive_audio_output():
    async with client.aio.live.connect(model=model_name, config=config) as session:
        message = "Tell me a short story."
        print(f"User (text input): {message}")
        await session.send_client_content(
            turns={"role": "user", "parts": [{"text": message}]},
            turn_complete=True
        )

        print(f"Receiving audio response, saving to {OUTPUT_WAV_FILE}...")
        with wave.open(OUTPUT_WAV_FILE, "wb") as wf:
            wf.setnchannels(1)  # Mono
            wf.setsampwidth(2)  # 16-bit PCM
            wf.setframerate(24000)  # Output audio is 24kHz

            async for response in session.receive():
                if response.data is not None: # response.data contains audio bytes
                    wf.writeframes(response.data)
                # You can also check for output_transcription if enabled
                if response.server_content and response.server_content.output_transcription:
                    print(f"Live Transcript: {response.server_content.output_transcription.text}")
                if response.server_content and response.server_content.generation_complete:
                    print("Audio generation complete.")
                    break
        print(f"Audio saved to {OUTPUT_WAV_FILE}")

if __name__ == "__main__":
    asyncio.run(receive_audio_output())
```

### Receiving Audio Transcriptions

#### Output Audio Transcription

Enable transcription of the model's audio output. The language is inferred.

```python
config = {
    "response_modalities": ["AUDIO"], # Must be AUDIO
    "output_audio_transcription": {} # Enable transcription of model's speech
}
# ... in session.receive() loop:
# async for response in session.receive():
#     if response.server_content and response.server_content.output_transcription:
#         print(f"Model Speech Transcript: {response.server_content.output_transcription.text}")
```

#### Input Audio Transcription

Enable transcription of the user's audio input.

```python
config = {
    "response_modalities": ["TEXT"], # Can be TEXT or AUDIO
    "realtime_input_config": { # Needed if sending raw audio with send_realtime_input
        "automatic_activity_detection": {"disabled": False}, # Or True for manual VAD
    },
    "input_audio_transcription": {} # Enable transcription of user's speech
}
# ... in session.receive() loop:
# async for msg in session.receive():
#     if msg.server_content and msg.server_content.input_transcription:
#         print(f'User Speech Transcript: {msg.server_content.input_transcription.text}')
```

### Streaming Audio and Video

The PDF mentions that examples for streaming audio and video are available in the cookbooks repository.

- View on GitHub: [Live API - Get Started](https://github.com/google-gemini/cookbook/blob/main/quickstarts/Get_started_LiveAPI.py)

---

## 5. Session Configuration

### System Instructions

Steer model behavior for the entire session.

```python
from google.genai import types
config = {
    "system_instruction": types.Content(
        parts=[
            types.Part(
                text="You are a friendly and helpful assistant. Always answer in a cheerful tone."
            )
        ]
    ),
    "response_modalities": ["TEXT"], # Or ["AUDIO"]
}
```

### Incremental Content Updates

Send text input to establish or restore session context.

- For short contexts: Send turn-by-turn interactions.
  ```python
  # In an async function with 'session'
  turns = [
      {"role": "user", "parts": [{"text": "What is the capital of France?"}]},
      {"role": "model", "parts": [{"text": "Paris"}]},
  ]
  await session.send_client_content(turns=turns, turn_complete=False) # turn_complete=False for ongoing context

  next_turn = [{"role": "user", "parts": [{"text": "What about Germany?"}]}]
  await session.send_client_content(turns=next_turn, turn_complete=True) # True for final part of this exchange
  ```
- For longer contexts: Provide a single message summary to conserve context window.

### Changing Voice and Language

#### Specifying Voice

Supported voices: Puck, Charon, Kore, Fenrir, Aoede, Leda, Orus, Zephyr.

```python
from google.genai import types
config = types.LiveConnectConfig(
    response_modalities=["AUDIO"],
    speech_config=types.SpeechConfig(
        voice_config=types.VoiceConfig(
            prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name="Kore") # Example voice
        )
    )
)
```

__Note__: `generateContent` API has a different set of voices.

#### Changing Language

Set the BCP-47 language code.

```python
from google.genai import types
config = types.LiveConnectConfig(
    response_modalities=["AUDIO"],
    speech_config=types.SpeechConfig(
        language_code="de-DE", # Example: German (Germany)
    )
)
```

__Note__: Native audio output models automatically choose the language and don't support explicit `language_code` setting.

---

## 6. Native Audio Output Features

These features provide higher quality audio with better pacing, naturalness, and mood.

### Supported Models

- `gemini-2.5-flash-preview-native-audio-dialog`    # should be always the preferred default model in implementations of ours
- `gemini-2.5-flash-exp-native-audio-thinking-dialog` (supports "thinking" capabilities)

__Note__: Native audio models currently have limited tool use support.

### Using Native Audio Output

Configure one of the native audio models and set `response_modalities` to `["AUDIO"]`.

```python
from google.genai import types
model_name = "gemini-2.5-flash-preview-native-audio-dialog"
config = types.LiveConnectConfig(response_modalities=["AUDIO"])

# async with client.aio.live.connect(model=model_name, config=config) as session:
#     # Send audio/text input and receive native audio output
```

### Affective Dialog

Allows Gemini to adapt its response style to the input expression and tone. __Requires API version `v1alpha`.__

```python
from google.genai import types
# Initialize client with v1alpha
client_v1alpha = genai.Client(api_key="YOUR_GEMINI_API_KEY", http_options={"api_version": "v1alpha"})

model_name = "gemini-2.5-flash-preview-native-audio-dialog" # Must be a native audio model
config_affective = types.LiveConnectConfig(
    response_modalities=["AUDIO"],
    enable_affective_dialog=True
)
# Use client_v1alpha.aio.live.connect(model=model_name, config=config_affective)
```

### Proactive Audio

Gemini can proactively decide not to respond if the content is not relevant. __Requires API version `v1alpha`.__

```python
from google.genai import types
# Initialize client with v1alpha
client_v1alpha = genai.Client(api_key="YOUR_GEMINI_API_KEY", http_options={"api_version": "v1alpha"})

model_name = "gemini-2.5-flash-preview-native-audio-dialog" # Must be a native audio model
config_proactive = types.LiveConnectConfig(
    response_modalities=["AUDIO"],
    proactivity={'proactive_audio': True}
)
# Use client_v1alpha.aio.live.connect(model=model_name, config=config_proactive)
```

### Native Audio Output with Thinking

Available via `gemini-2.5-flash-exp-native-audio-thinking-dialog`.

```python
from google.genai import types
model_name = "gemini-2.5-flash-exp-native-audio-thinking-dialog"
config = types.LiveConnectConfig(response_modalities=["AUDIO"])
# Use as normal native audio model
```

---

## 7. Tool Use with Live API

Define tools like Function calling, Code execution, and Google Search.

- Cookbook: [Live API Tools](https://github.com/google-gemini/cookbook/blob/main/quickstarts/Get_started_LiveAPI_tools.ipynb)

### Overview of Supported Tools

| Tool | `gemini-2.0-flash-live-001` | `gemini-2.5-flash-preview-native-audio-dialog` | `gemini-2.5-flash-exp-native-audio-thinking-dialog` | |------------------|-----------------------------|------------------------------------------------|---------------------------------------------------| | Search | Yes | Yes | Yes | | Function calling | Yes | Yes | No | | Code execution | Yes | No | No | | URL context | Yes | No | No |

### Function Calling

Define function declarations in session config. Client must handle tool responses manually.

```python
import asyncio
from google import genai
from google.genai import types

client = genai.Client(api_key="YOUR_GEMINI_API_KEY")
model_name = "gemini-2.0-flash-live-001" # Ensure model supports function calling

# Simple function definitions
turn_on_the_lights_fn = {"name": "turn_on_the_lights"}
turn_off_the_lights_fn = {"name": "turn_off_the_lights"}
tools_config = [{"function_declarations": [turn_on_the_lights_fn, turn_off_the_lights_fn]}]

config = {"response_modalities": ["TEXT"], "tools": tools_config}

async def function_calling_example():
    async with client.aio.live.connect(model=model_name, config=config) as session:
        prompt = "Turn on the lights please"
        print(f"User: {prompt}")
        await session.send_client_content(turns=[{"role": "user", "parts": [{"text": prompt}]}], turn_complete=True)

        async for chunk in session.receive():
            if chunk.server_content and chunk.text is not None:
                print(f"Model: {chunk.text}")
            elif chunk.tool_call:
                print(f"Tool call received: {chunk.tool_call.function_calls}")
                function_responses = []
                for fc in chunk.tool_call.function_calls:
                    # Simulate function execution
                    print(f"Executing function: {fc.name} with ID: {fc.id}")
                    # Replace with actual function logic
                    result = {"status": "ok", "action": f"{fc.name} executed"}
                    
                    function_response = types.FunctionResponse(
                        id=fc.id, # Use the ID from the tool_call
                        name=fc.name,
                        response=result # Actual response from your function
                    )
                    function_responses.append(function_response)
                
                print(f"Sending tool responses: {function_responses}")
                await session.send_tool_response(function_responses=function_responses)
            
            if chunk.server_content and chunk.server_content.generation_complete:
                print("Generation complete for this turn.")
                # Potentially break or wait for next user input
                break # For this example, end after one interaction

if __name__ == "__main__":
    asyncio.run(function_calling_example())
```

#### Asynchronous Function Calling

Allows interaction while functions run.

1. Add `behavior: "NON_BLOCKING"` to function definition.
   ```python
   non_blocking_fn = {"name": "long_task", "behavior": "NON_BLOCKING"}
   ```

2. Specify `scheduling` in `FunctionResponse`:

   - `INTERRUPT`: Model reports response immediately.
   - `WHEN_IDLE`: Model reports after current task.
   - `SILENT`: Model uses knowledge later.

   ```python
   function_response = types.FunctionResponse(
       id=fc.id, name=fc.name,
       response={"result": "task_started", "scheduling": "INTERRUPT"}
   )
   ```

### Code Execution

Define in session config.

```python
tools_config = [{'code_execution': {}}]
config = {"response_modalities": ["TEXT"], "tools": tools_config}

# ... in session.receive() loop:
# if chunk.server_content and chunk.server_content.model_turn:
#     for part in chunk.server_content.model_turn.parts:
#         if part.executable_code is not None:
#             print(f"Executable Code: {part.executable_code.code}")
#         if part.code_execution_result is not None:
#             print(f"Code Execution Result: {part.code_execution_result.output}")
```

### Grounding with Google Search

Enable in session config.

```python
tools_config = [{'google_search': {}}]
config = {"response_modalities": ["TEXT"], "tools": tools_config}
# Model may generate and execute Python code for Search. Handle executable_code and code_execution_result.
```

### Combining Multiple Tools

List multiple tool configurations in the `tools` array.

```python
tools_config = [
    {"google_search": {}},
    {"code_execution": {}},
    {"function_declarations": [turn_on_the_lights_fn]},
]
```

---

## 8. Session Control and Management

### Handling Interruptions

Users can interrupt model output. VAD detects this, cancels ongoing generation. Server sends `BidiGenerateContentServerContent` message with `interrupted: True`. Pending function calls are canceled, reported with their IDs.

```python
# async for response in session.receive():
#     if response.server_content and response.server_content.interrupted is True:
#         print("Model generation was interrupted by user.")
#         # Handle canceled function calls if any
```

### Voice Activity Detection (VAD)

#### Using Automatic VAD

Default behavior. Model detects speech in continuous audio input.

- If audio stream pauses >1s (e.g., mic off), send `audio_stream_end=True` to flush cached audio.
  ```python
  # await session.send_realtime_input(audio_stream_end=True)
  ```
- `send_realtime_input` is optimized for responsiveness with VAD, `send_client_content` for ordered context.

#### Configuring Automatic VAD

```python
from google.genai import types
config = {
    "response_modalities": ["TEXT"], # Or AUDIO
    "realtime_input_config": {
        "automatic_activity_detection": {
            "disabled": False, # Default
            "start_of_speech_sensitivity": types.StartSensitivity.START_SENSITIVITY_LOW,
            "end_of_speech_sensitivity": types.EndSensitivity.END_SENSITIVITY_LOW,
            "prefix_padding_ms": 20,   # How much audio before speech start is included
            "silence_duration_ms": 1000, # How long silence before speech end (default is 100ms in PDF, example shows 1000)
        }
    }
}
```

#### Disabling Automatic VAD (Manual Control)

Client sends `activityStart` and `activityEnd` messages. `audioStreamEnd` is not used.

```python
config = {
    "response_modalities": ["TEXT"], # Or AUDIO
    "realtime_input_config": {"automatic_activity_detection": {"disabled": True}},
}

# ...
# await session.send_realtime_input(activity_start=types.ActivityStart())
# await session.send_realtime_input(audio=types.Blob(data=audio_bytes, mime_type="audio/pcm;rate=16000"))
# await session.send_realtime_input(activity_end=types.ActivityEnd())
# ...
```

### Token Count

Find consumed tokens in `usageMetadata` field of server messages.

```python
# async for message in session.receive():
#     if message.usage_metadata:
#         usage = message.usage_metadata
#         print(f"Total tokens: {usage.total_token_count}")
#         if usage.response_tokens_details:
#             for detail in usage.response_tokens_details:
#                 if isinstance(detail, types.ModalityTokenCount): # Check type
#                     print(f"  {detail.modality}: {detail.token_count}")
```

### Extending Session Duration

Maximum session duration can be extended using:

#### Context Window Compression

Enable by setting `context_window_compression` in session config.

```python
from google.genai import types
config_compression = types.LiveConnectConfig(
    response_modalities=["AUDIO"], # Or TEXT
    context_window_compression=(
        types.ContextWindowCompressionConfig(
            sliding_window=types.SlidingWindow(), # Default compression
            # trigger_tokens=N # Optional: number of tokens to trigger compression
        )
    ),
)
```

#### Session Resumption

Prevent termination on WebSocket resets. Server sends `SessionResumptionUpdate` messages. Use the `new_handle` from the update to resume.

```python
import asyncio
from google import genai
from google.genai import types

client = genai.Client(api_key="YOUR_GEMINI_API_KEY")
model_name = "gemini-2.0-flash-live-001"
previous_session_handle = None # Store this persistently for actual resumption

async def resumable_interaction():
    global previous_session_handle
    print(f"Attempting to connect/resume with handle: {previous_session_handle}")
    
    current_config = types.LiveConnectConfig(
        response_modalities=["TEXT"], # Or AUDIO
        session_resumption=types.SessionResumptionConfig(
            handle=previous_session_handle # Pass None for new session
        ),
    )

    async with client.aio.live.connect(model=model_name, config=current_config) as session:
        print("Session active.")
        # Example: send a message and wait for resumption update
        await session.send_client_content(
            turns=[types.Content(role="user", parts=[types.Part(text="Hello world!")])],
            turn_complete=True
        )
        
        async for message in session.receive():
            if message.text:
                print(f"Model: {message.text}")

            if message.session_resumption_update:
                update = message.session_resumption_update
                if update.resumable and update.new_handle:
                    previous_session_handle = update.new_handle
                    print(f"Received new session handle: {previous_session_handle}")
                    # Persist this handle for future resumption
            
            if message.server_content and message.server_content.generation_complete:
                print("Turn complete.")
                # For this example, we'll break after one interaction to show handle update
                # In a real app, you'd continue the interaction loop
                if message.session_resumption_update and message.session_resumption_update.new_handle:
                    break # Break if we got a new handle in this message
                elif not message.session_resumption_update: # If no handle update, break anyway for example
                    break


if __name__ == "__main__":
    # Simulate running it multiple times to test resumption
    # In a real app, previous_session_handle would be stored persistently
    asyncio.run(resumable_interaction())
    print(f"After first run, handle is: {previous_session_handle}")
    # asyncio.run(resumable_interaction()) # Second run would use the handle
    # print(f"After second run, handle is: {previous_session_handle}")
```

### GoAway Message (Disconnection Warning)

Server sends `GoAway` message before terminating connection. Includes `timeLeft`.

```python
# async for response in session.receive():
#     if response.go_away is not None:
#         print(f"Connection will terminate in: {response.go_away.time_left.seconds} seconds.")
#         # Implement logic to save state or attempt resumption
```

### Generation Complete Message

Server sends `generation_complete: True` in `BidiGenerateContentServerContent` when model finishes a response turn.

```python
# async for response in session.receive():
#     if response.server_content and response.server_content.generation_complete is True:
#         print("Model has finished generating this response turn.")
```

---

## 9. Media Resolution

Specify input media resolution in session config.

```python
from google.genai import types
config = types.LiveConnectConfig(
    response_modalities=["AUDIO"], # Or TEXT, if video input is used
    media_resolution=types.MediaResolution.MEDIA_RESOLUTION_LOW, # Or HIGH, etc.
)
```

---

## 10. Limitations

- __Response Modalities__: Only one (TEXT or AUDIO) per session.

- __Client Authentication__: Server-to-server authentication only. Not for direct client-side use in browsers/mobile apps without an intermediary server.

- __Session Duration__:

  - Without compression: Audio-only ~15 mins, Audio+Video ~2 mins.
  - Can be extended to "unlimited" with context window compression and session resumption.

- __Context Window__:

  - Native audio output models: 128k tokens.
  - Other Live API models: 32k tokens.

- __Supported Languages__: A specific list of languages is supported (see PDF for full list). Native audio models choose language automatically.

---

## 11. Third-Party Integrations

For web/mobile app deployments, explore:

- Daily: [daily.co/products/gemini/multimodal-live-api](https://www.daily.co/products/gemini/multimodal-live-api/)
- LiveKit: [docs.livekit.io/agents/integrations/google/#multimodal-live-api](https://docs.livekit.io/agents/integrations/google/#multimodal-live-api)

---

## 12. Further Resources

- Try Live API in Google AI Studio: [aistudio.google.com/app/live](https://aistudio.google.com/app/live)

- Gemini 2.0 Flash Live model page: [/gemini-api/docs/models#live-api](https://ai.google.dev/gemini-api/docs/models#live-api) (Note: Link might need to be prefixed with `https://ai.google.dev`)

- Cookbooks:

  - [Get Started LiveAPI.ipynb](https://github.com/google-gemini/cookbook/blob/main/quickstarts/Get_started_LiveAPI.ipynb)
  - [Get Started LiveAPI tools.ipynb](https://github.com/google-gemini/cookbook/blob/main/quickstarts/Get_started_LiveAPI_tools.ipynb)
  - [Get Started LiveAPI.py](https://github.com/google-gemini/cookbook/blob/main/quickstarts/Get_started_LiveAPI.py)

---

*This document is based on the Gemini Live API documentation, version as of May 2025.*
