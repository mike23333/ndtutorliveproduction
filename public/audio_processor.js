/**
 * Web Audio API Handler for Real-Time Voice Interaction
 * Handles microphone capture, downsampling, and PCM playback
 */

class AudioHandler {
  constructor() {
    this.audioContext = null;
    this.microphoneStream = null;
    this.scriptProcessor = null;
    this.mediaStreamSource = null;
    this.playbackQueue = [];
    this.isPlaying = false;
    this.onDataCallback = null;

    // Audio configuration
    this.TARGET_SAMPLE_RATE = 16000; // Gemini expects 16kHz input
    this.PLAYBACK_SAMPLE_RATE = 24000; // Gemini sends 24kHz output
    this.BUFFER_SIZE = 4096;

    // Turn-based buffer for error audio capture (grows dynamically per turn)
    this.turnBuffer = [];  // Array of Int16Array chunks, grows during user's turn
    this.turnBufferSampleCount = 0;
    this.MAX_TURN_SECONDS = 120;  // Safety limit: 120 seconds max per turn
  }

  /**
   * Initialize AudioContext (requires user gesture)
   */
  async initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: this.PLAYBACK_SAMPLE_RATE
      });
    }

    // Resume if suspended (autoplay policy)
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    return this.audioContext;
  }

  /**
   * Initialize turn buffer for audio capture
   * Called when recording starts
   */
  initTurnBuffer() {
    this.turnBuffer = [];
    this.turnBufferSampleCount = 0;
    console.log('AudioHandler: Turn buffer initialized');
  }

  /**
   * Clear the turn buffer - call this when Gemini finishes responding
   * This marks the start of a new user turn
   */
  clearTurnBuffer() {
    this.turnBuffer = [];
    this.turnBufferSampleCount = 0;
    console.log('AudioHandler: Turn buffer cleared (new turn started)');
  }

  /**
   * Start recording from microphone with downsampling to 16kHz
   * @param {Function} onDataCallback - Called with base64-encoded PCM chunks
   */
  async startRecording(onDataCallback) {
    try {
      this.onDataCallback = onDataCallback;

      // Initialize audio context
      await this.initAudioContext();

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: this.TARGET_SAMPLE_RATE
        }
      });

      this.microphoneStream = stream;
      this.mediaStreamSource = this.audioContext.createMediaStreamSource(stream);

      // Initialize turn buffer for error audio capture
      this.initTurnBuffer();

      // Create script processor for audio data
      this.scriptProcessor = this.audioContext.createScriptProcessor(
        this.BUFFER_SIZE,
        1, // mono input
        1  // mono output
      );

      // Process audio input
      let chunkCount = 0;
      this.scriptProcessor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);

        // Downsample to 16kHz if needed
        const downsampledData = this.downsample(
          inputData,
          this.audioContext.sampleRate,
          this.TARGET_SAMPLE_RATE
        );

        // Convert to 16-bit PCM
        const pcmData = this.floatTo16BitPCM(downsampledData);

        // Store in turn buffer for error audio capture (grows dynamically)
        const maxSamples = this.TARGET_SAMPLE_RATE * this.MAX_TURN_SECONDS;
        if (this.turnBufferSampleCount < maxSamples) {
          // Store a copy of the chunk
          this.turnBuffer.push(new Int16Array(pcmData));
          this.turnBufferSampleCount += pcmData.length;
        }

        // Convert to base64
        const base64Data = this.arrayBufferToBase64(pcmData.buffer);

        chunkCount++;
        if (chunkCount <= 3) {
          console.log('AudioHandler onaudioprocess chunk #' + chunkCount + ', base64 size:', base64Data.length, 'hasCallback:', !!this.onDataCallback);
        }

        // Send to callback
        if (this.onDataCallback) {
          this.onDataCallback(base64Data);
        }
      };

      // Connect nodes
      this.mediaStreamSource.connect(this.scriptProcessor);
      this.scriptProcessor.connect(this.audioContext.destination);

      return true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  /**
   * Stop recording and clean up resources
   */
  stopRecording() {
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }

    if (this.mediaStreamSource) {
      this.mediaStreamSource.disconnect();
      this.mediaStreamSource = null;
    }

    if (this.microphoneStream) {
      this.microphoneStream.getTracks().forEach(track => track.stop());
      this.microphoneStream = null;
    }

    this.onDataCallback = null;

    // Clear turn buffer to free memory
    this.turnBuffer = [];
    this.turnBufferSampleCount = 0;
  }

  /**
   * Play audio chunk from Gemini (24kHz PCM base64)
   * @param {string} base64Data - Base64-encoded PCM audio data
   */
  async playChunk(base64Data) {
    try {
      await this.initAudioContext();

      // Decode base64 to ArrayBuffer
      const arrayBuffer = this.base64ToArrayBuffer(base64Data);

      // Convert to Float32Array
      const pcmData = new Int16Array(arrayBuffer);
      const floatData = this.int16ToFloat32(pcmData);

      // Create audio buffer
      const audioBuffer = this.audioContext.createBuffer(
        1, // mono
        floatData.length,
        this.PLAYBACK_SAMPLE_RATE
      );

      audioBuffer.getChannelData(0).set(floatData);

      // Schedule playback
      this.schedulePlayback(audioBuffer);
    } catch (error) {
      console.error('Failed to play audio chunk:', error);
      throw error;
    }
  }

  /**
   * Schedule audio buffer for seamless playback
   * @param {AudioBuffer} audioBuffer
   */
  schedulePlayback(audioBuffer) {
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext.destination);

    // Calculate when to start playback
    const currentTime = this.audioContext.currentTime;

    if (!this.isPlaying) {
      // Start immediately
      source.start(currentTime);
      this.isPlaying = true;
      this.nextPlaybackTime = currentTime + audioBuffer.duration;
    } else {
      // Schedule after previous chunk
      source.start(this.nextPlaybackTime);
      this.nextPlaybackTime += audioBuffer.duration;
    }

    // Track when playback ends
    source.onended = () => {
      if (this.audioContext.currentTime >= this.nextPlaybackTime - 0.1) {
        this.isPlaying = false;
      }
    };
  }

  /**
   * Downsample audio data
   * @param {Float32Array} buffer - Input audio data
   * @param {number} fromSampleRate - Source sample rate
   * @param {number} toSampleRate - Target sample rate
   * @returns {Float32Array} Downsampled data
   */
  downsample(buffer, fromSampleRate, toSampleRate) {
    if (fromSampleRate === toSampleRate) {
      return buffer;
    }

    const sampleRateRatio = fromSampleRate / toSampleRate;
    const newLength = Math.round(buffer.length / sampleRateRatio);
    const result = new Float32Array(newLength);

    let offsetResult = 0;
    let offsetBuffer = 0;

    while (offsetResult < result.length) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
      let accum = 0;
      let count = 0;

      for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
        accum += buffer[i];
        count++;
      }

      result[offsetResult] = accum / count;
      offsetResult++;
      offsetBuffer = nextOffsetBuffer;
    }

    return result;
  }

  /**
   * Convert Float32Array to 16-bit PCM
   * @param {Float32Array} floatArray
   * @returns {Int16Array}
   */
  floatTo16BitPCM(floatArray) {
    const int16Array = new Int16Array(floatArray.length);

    for (let i = 0; i < floatArray.length; i++) {
      const sample = Math.max(-1, Math.min(1, floatArray[i]));
      int16Array[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    }

    return int16Array;
  }

  /**
   * Convert Int16Array to Float32Array
   * @param {Int16Array} int16Array
   * @returns {Float32Array}
   */
  int16ToFloat32(int16Array) {
    const float32Array = new Float32Array(int16Array.length);

    for (let i = 0; i < int16Array.length; i++) {
      const sample = int16Array[i];
      float32Array[i] = sample < 0 ? sample / 0x8000 : sample / 0x7FFF;
    }

    return float32Array;
  }

  /**
   * Convert ArrayBuffer to base64
   * @param {ArrayBuffer} buffer
   * @returns {string}
   */
  arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;

    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }

    return window.btoa(binary);
  }

  /**
   * Convert base64 to ArrayBuffer
   * @param {string} base64
   * @returns {ArrayBuffer}
   */
  base64ToArrayBuffer(base64) {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);

    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return bytes.buffer;
  }

  /**
   * Extract the entire turn buffer as WAV Blob
   * Used for capturing error audio when mark_for_review is triggered
   * @returns {Blob|null} WAV blob or null if no data
   */
  extractAudioAsWav() {
    if (!this.turnBuffer || this.turnBuffer.length === 0 || this.turnBufferSampleCount === 0) {
      console.warn('AudioHandler: No audio data in turn buffer');
      return null;
    }

    // Concatenate all chunks into one array
    const allSamples = new Int16Array(this.turnBufferSampleCount);
    let offset = 0;
    for (const chunk of this.turnBuffer) {
      allSamples.set(chunk, offset);
      offset += chunk.length;
    }

    const actualSeconds = (this.turnBufferSampleCount / this.TARGET_SAMPLE_RATE).toFixed(1);
    console.log('AudioHandler: Extracted', actualSeconds, 'seconds of turn audio (', this.turnBufferSampleCount, 'samples)');

    // Create WAV blob
    return this.createWavBlob(allSamples, this.TARGET_SAMPLE_RATE);
  }

  /**
   * Create WAV blob from Int16 PCM samples
   * Generates proper RIFF/WAV header for mono 16-bit audio
   * @param {Int16Array} samples - PCM audio samples
   * @param {number} sampleRate - Sample rate (16000)
   * @returns {Blob} WAV blob
   */
  createWavBlob(samples, sampleRate) {
    const numChannels = 1;
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const dataSize = samples.length * bytesPerSample;
    const headerSize = 44;
    const fileSize = headerSize + dataSize;

    const buffer = new ArrayBuffer(fileSize);
    const view = new DataView(buffer);

    // RIFF header
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, fileSize - 8, true);  // File size minus RIFF header
    this.writeString(view, 8, 'WAVE');

    // fmt subchunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);  // Subchunk size (16 for PCM)
    view.setUint16(20, 1, true);   // Audio format (1 = PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);  // Byte rate
    view.setUint16(32, numChannels * bytesPerSample, true);  // Block align
    view.setUint16(34, bitsPerSample, true);

    // data subchunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Write PCM samples (copy Int16 data)
    const int16View = new Int16Array(buffer, 44);
    int16View.set(samples);

    return new Blob([buffer], { type: 'audio/wav' });
  }

  /**
   * Helper to write ASCII string to DataView
   * @param {DataView} view - DataView to write to
   * @param {number} offset - Byte offset
   * @param {string} string - ASCII string to write
   */
  writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  /**
   * Clean up all resources
   */
  destroy() {
    this.stopRecording();

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.playbackQueue = [];
    this.isPlaying = false;
  }
}

// Export for use in TypeScript
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AudioHandler;
}

// Make available on window for browser use
if (typeof window !== 'undefined') {
  window.AudioHandler = AudioHandler;
}
