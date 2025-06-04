// static/audio-player-processor.js

class PCMPlayerProcessor extends AudioWorkletProcessor {
    constructor(options) {
        super(options);
        this._buffer = []; // Queue of Float32Array chunks
        this._bufferSampleCount = 0; // Total samples currently in the buffer queue
        
        // The process method is called with 128-sample frames by default.
        // This is the 'quantum' size.
        this.port.onmessage = (event) => {
            if (event.data instanceof Float32Array) {
                this._buffer.push(event.data);
                this._bufferSampleCount += event.data.length;
                // Optional: console.log(`[Worklet] Received chunk, size: ${event.data.length}, total buffered samples: ${this._bufferSampleCount}`);
            }
        };
    }

    process(inputs, outputs, parameters) {
        const outputChannel = outputs[0][0]; // Assuming mono output, first channel

        if (!outputChannel) {
            // This can happen if the node is disconnected or context is closing
            return true; 
        }

        let samplesWritten = 0;
        const outputFrameSize = outputChannel.length; // Typically 128 samples

        while (samplesWritten < outputFrameSize && this._buffer.length > 0) {
            const currentChunk = this._buffer[0];
            const samplesToWriteFromChunk = Math.min(outputFrameSize - samplesWritten, currentChunk.length);

            for (let i = 0; i < samplesToWriteFromChunk; i++) {
                outputChannel[samplesWritten + i] = currentChunk[i];
            }

            samplesWritten += samplesToWriteFromChunk;
            this._bufferSampleCount -= samplesToWriteFromChunk;

            if (samplesToWriteFromChunk < currentChunk.length) {
                // Partial chunk was written, slice the remainder
                this._buffer[0] = currentChunk.subarray(samplesToWriteFromChunk);
            } else {
                // Full chunk was written, remove it from queue
                this._buffer.shift();
            }
        }

        // If buffer was exhausted and we couldn't fill the output frame, fill with silence
        for (let i = samplesWritten; i < outputFrameSize; i++) {
            outputChannel[i] = 0; // Silence
        }
        
        // Keep processor alive
        return true; 
    }
}

registerProcessor('pcm-player-processor', PCMPlayerProcessor);
