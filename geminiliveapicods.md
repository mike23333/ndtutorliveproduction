docs: https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API





This example reads a WAV file, sends it in the correct format, and saves the received data as WAV file. For complete end-to-end examples including a client application, see Example applications.

You can send audio by converting it to 16-bit PCM, 16kHz, mono format, and you can receive audio by setting AUDIO as response modality. The output uses a sample rate of 24kHz.

Python
JavaScript

// Test file: https://storage.googleapis.com/generativeai-downloads/data/16000.wav
// Install helpers: npm install wavefile
import { GoogleGenAI, Modality } from '@google/genai';
import * as fs from "node:fs";
import pkg from 'wavefile';
const { WaveFile } = pkg;

const ai = new GoogleGenAI({});
// WARNING: Do not use API keys in client-side (browser based) applications
// Consider using Ephemeral Tokens instead
// More information at: https://ai.google.dev/gemini-api/docs/ephemeral-tokens

const model = "gemini-2.5-flash-native-audio-preview-09-2025"
const config = {
  responseModalities: [Modality.AUDIO],
  systemInstruction: "You are a helpful assistant and answer in a friendly tone."
};

async function live() {
    const responseQueue = [];

    async function waitMessage() {
        let done = false;
        let message = undefined;
        while (!done) {
            message = responseQueue.shift();
            if (message) {
                done = true;
            } else {
                await new Promise((resolve) => setTimeout(resolve, 100));
            }
        }
        return message;
    }

    async function handleTurn() {
        const turns = [];
        let done = false;
        while (!done) {
            const message = await waitMessage();
            turns.push(message);
            if (message.serverContent && message.serverContent.turnComplete) {
                done = true;
            }
        }
        return turns;
    }

    const session = await ai.live.connect({
        model: model,
        callbacks: {
            onopen: function () {
                console.debug('Opened');
            },
            onmessage: function (message) {
                responseQueue.push(message);
            },
            onerror: function (e) {
                console.debug('Error:', e.message);
            },
            onclose: function (e) {
                console.debug('Close:', e.reason);
            },
        },
        config: config,
    });

    // Send Audio Chunk
    const fileBuffer = fs.readFileSync("sample.wav");

    // Ensure audio conforms to API requirements (16-bit PCM, 16kHz, mono)
    const wav = new WaveFile();
    wav.fromBuffer(fileBuffer);
    wav.toSampleRate(16000);
    wav.toBitDepth("16");
    const base64Audio = wav.toBase64();

    // If already in correct format, you can use this:
    // const fileBuffer = fs.readFileSync("sample.pcm");
    // const base64Audio = Buffer.from(fileBuffer).toString('base64');

    session.sendRealtimeInput(
        {
            audio: {
                data: base64Audio,
                mimeType: "audio/pcm;rate=16000"
            }
        }

    );

    const turns = await handleTurn();

    // Combine audio data strings and save as wave file
    const combinedAudio = turns.reduce((acc, turn) => {
        if (turn.data) {
            const buffer = Buffer.from(turn.data, 'base64');
            const intArray = new Int16Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / Int16Array.BYTES_PER_ELEMENT);
            return acc.concat(Array.from(intArray));
        }
        return acc;
    }, []);

    const audioBuffer = new Int16Array(combinedAudio);

    const wf = new WaveFile();
    wf.fromScratch(1, 24000, '16', audioBuffer);  // output is 24kHz
    fs.writeFileSync('audio.wav', wf.toBuffer());

    session.close();
}

async function main() {
    await live().catch((e) => console.error('got error', e));
}

main();



v
Establishing a connection
The following example shows how to create a connection with an API key:

Python
JavaScript

import { GoogleGenAI, Modality } from '@google/genai';

const ai = new GoogleGenAI({});
const model = 'gemini-2.5-flash-native-audio-preview-09-2025';
const config = { responseModalities: [Modality.AUDIO] };

async function main() {

  const session = await ai.live.connect({
    model: model,
    callbacks: {
      onopen: function () {
        console.debug('Opened');
      },
      onmessage: function (message) {
        console.debug(message);
      },
      onerror: function (e) {
        console.debug('Error:', e.message);
      },
      onclose: function (e) {
        console.debug('Close:', e.reason);
      },
    },
    config: config,
  });

  console.debug("Session started");
  // Send content...

  session.close();
}

main();
Interaction modalities
The following sections provide examples and supporting context for the different input and output modalities available in Live API.


Audio formats
Audio data in the Live API is always raw, little-endian, 16-bit PCM. Audio output always uses a sample rate of 24kHz. Input audio is natively 16kHz, but the Live API will resample if needed so any sample rate can be sent. To convey the sample rate of input audio, set the MIME type of each audio-containing Blob to a value like audio/pcm;rate=16000.

Sending text
Here's how you can send text:

Python
JavaScript

const message = 'Hello, how are you?';
session.sendClientContent({ turns: message, turnComplete: true });
Incremental content updates
Use incremental updates to send text input, establish session context, or restore session context. For short contexts you can send turn-by-turn interactions to represent the exact sequence of events:

Python
JavaScript

let inputTurns = [
  { "role": "user", "parts": [{ "text": "What is the capital of France?" }] },
  { "role": "model", "parts": [{ "text": "Paris" }] },
]

session.sendClientContent({ turns: inputTurns, turnComplete: false })

inputTurns = [{ "role": "user", "parts": [{ "text": "What is the capital of Germany?" }] }]

session.sendClientContent({ turns: inputTurns, turnComplete: true })
For longer contexts it's recommended to provide a single message summary to free up the context window for subsequent interactions. See Session Resumption for another method for loading session context.






Ephemeral tokens

content_copy


Ephemeral tokens are short-lived authentication tokens for accessing the Gemini API through WebSockets. They are designed to enhance security when you are connecting directly from a user's device to the API (a client-to-server implementation). Like standard API keys, ephemeral tokens can be extracted from client-side applications such as web browsers or mobile apps. But because ephemeral tokens expire quickly and can be restricted, they significantly reduce the security risks in a production environment. You should use them when accessing the Live API directly from client-side applications to enhance API key security.

Note: At this time, ephemeral tokens are only compatible with Live API.
How ephemeral tokens work
Here's how ephemeral tokens work at a high level:

Your client (e.g. web app) authenticates with your backend.
Your backend requests an ephemeral token from Gemini API's provisioning service.
Gemini API issues a short-lived token.
Your backend sends the token to the client for WebSocket connections to Live API. You can do this by swapping your API key with an ephemeral token.
The client then uses the token as if it were an API key.
Ephemeral tokens overview

This enhances security because even if extracted, the token is short-lived, unlike a long-lived API key deployed client-side. Since the client sends data directly to Gemini, this also improves latency and avoids your backends needing to proxy the real time data.

Create an ephemeral token
Here is a simplified example of how to get an ephemeral token from Gemini. By default, you'll have 1 minute to start new Live API sessions using the token from this request (newSessionExpireTime), and 30 minutes to send messages over that connection (expireTime).

Python
JavaScript

import { GoogleGenAI } from "@google/genai";

const client = new GoogleGenAI({});
const expireTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  const token: AuthToken = await client.authTokens.create({
    config: {
      uses: 1, // The default
      expireTime: expireTime // Default is 30 mins
      newSessionExpireTime: new Date(Date.now() + (1 * 60 * 1000)), // Default 1 minute in the future
      httpOptions: {apiVersion: 'v1alpha'},
    },
  });
For expireTime value constraints, defaults, and other field specs, see the API reference. Within the expireTime timeframe, you'll need sessionResumption to reconnect the call every 10 minutes (this can be done with the same token even if uses: 1).

It's also possible to lock an ephemeral token to a set of configurations. This might be useful to further improve security of your application and keep your system instructions on the server side.

Python
JavaScript

import { GoogleGenAI } from "@google/genai";

const client = new GoogleGenAI({});
const expireTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();

const token = await client.authTokens.create({
    config: {
        uses: 1, // The default
        expireTime: expireTime,
        liveConnectConstraints: {
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            config: {
                sessionResumption: {},
                temperature: 0.7,
                responseModalities: ['AUDIO']
            }
        },
        httpOptions: {
            apiVersion: 'v1alpha'
        }
    }
});

// You'll need to pass the value under token.name back to your client to use it
You can also lock a subset of fields, see the SDK documentation for more info.

Connect to Live API with an ephemeral token
Once you have an ephemeral token, you use it as if it were an API key (but remember, it only works for the live API, and only with the v1alpha version of the API).

The use of ephemeral tokens only adds value when deploying applications that follow client-to-server implementation approach.

JavaScript

import { GoogleGenAI, Modality } from '@google/genai';

// Use the token generated in the "Create an ephemeral token" section here
const ai = new GoogleGenAI({
  apiKey: token.name
});
const model = 'gemini-2.5-flash-native-audio-preview-09-2025';
const config = { responseModalities: [Modality.AUDIO] };

async function main() {

  const session = await ai.live.connect({
    model: model,
    config: config,
    callbacks: { ... },
  });

  // Send content...

  session.close();
}

main();
Note: If not using the SDK, note that ephemeral tokens must either be passed in an access_token query parameter, or in an HTTP Authorization prefixed by the auth-scheme Token.
See Get started with Live API for more examples.

Best practices
Set a short expiration duration using the expire_time parameter.
Tokens expire, requiring re-initiation of the provisioning process.
Verify secure authentication for your own backend. Ephemeral tokens will only be as secure as your backend authentication method.
Generally, avoid using ephemeral tokens for backend-to-Gemini connections, as this path is typically considered secure.


Session resumption
To prevent session termination when the server periodically resets the WebSocket connection, configure the sessionResumption field within the setup configuration.

Passing this configuration causes the server to send SessionResumptionUpdate messages, which can be used to resume the session by passing the last resumption token as the SessionResumptionConfig.handle of the subsequent connection.

Resumption tokens are valid for 2 hr after the last sessions termination.

Python
JavaScript

import { GoogleGenAI, Modality } from '@google/genai';

const ai = new GoogleGenAI({});
const model = 'gemini-2.5-flash-native-audio-preview-09-2025';

async function live() {
  const responseQueue = [];

  async function waitMessage() {
    let done = false;
    let message = undefined;
    while (!done) {
      message = responseQueue.shift();
      if (message) {
        done = true;
      } else {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    return message;
  }

  async function handleTurn() {
    const turns = [];
    let done = false;
    while (!done) {
      const message = await waitMessage();
      turns.push(message);
      if (message.serverContent && message.serverContent.turnComplete) {
        done = true;
      }
    }
    return turns;
  }

console.debug('Connecting to the service with handle %s...', previousSessionHandle)
const session = await ai.live.connect({
  model: model,
  callbacks: {
    onopen: function () {
      console.debug('Opened');
    },
    onmessage: function (message) {
      responseQueue.push(message);
    },
    onerror: function (e) {
      console.debug('Error:', e.message);
    },
    onclose: function (e) {
      console.debug('Close:', e.reason);
    },
  },
  config: {
    responseModalities: [Modality.AUDIO],
    sessionResumption: { handle: previousSessionHandle }
    // The handle of the session to resume is passed here, or else null to start a new session.
  }
});

const inputTurns = 'Hello how are you?';
session.sendClientContent({ turns: inputTurns });

const turns = await handleTurn();
for (const turn of turns) {
  if (turn.sessionResumptionUpdate) {
    if (turn.sessionResumptionUpdate.resumable && turn.sessionResumptionUpdate.newHandle) {
      let newHandle = turn.sessionResumptionUpdate.newHandle
      // ...Store newHandle and start new session with this handle here
    }
  }
}

  session.close();
}

async function main() {
  await live().catch((e) => console.error('got error', e));
}

main();
Receiving a message before the session disconnects
The server sends a GoAway message that signals that the current connection will soon be terminated. This message includes the timeLeft, indicating the remaining time and lets you take further action before the connection will be terminated as ABORTED.

Python
JavaScript

const turns = await handleTurn();

for (const turn of turns) {
  if (turn.goAway) {
    console.debug('Time left: %s\n', turn.goAway.timeLeft);
  }
}
Receiving a message when the generation is complete
The server sends a generationComplete message that signals that the model finished generating the response.

Python
JavaScript

const turns = await handleTurn();

for (const turn of turns) {
  if (turn.serverContent && turn.serverContent.generationComplete) {
    // The generation is complete
  }
}



true this on: 

Native audio capabilities
Our latest models feature native audio output, which provides natural, realistic-sounding speech and improved multilingual performance. Native audio also enables advanced features like affective (emotion-aware) dialogue, proactive audio (where the model intelligently decides when to respond to input), and "thinking".

Affective dialog
This feature lets Gemini adapt its response style to the input expression and tone.

To use affective dialog, set the api version to v1alpha and set enable_affective_dialog to truein the setup message:

Python
JavaScript

const ai = new GoogleGenAI({ httpOptions: {"apiVersion": "v1alpha"} });

const config = {
  responseModalities: [Modality.AUDIO],
  enableAffectiveDialog: true
};


The Live API only provides server-to-server authentication by default. If you're implementing your Live API application using a client-to-server approach, you need to use ephemeral tokens to mitigate security risks.

Session management with Live API

content_copy


In the Live API, a session refers to a persistent connection where input and output are streamed continuously over the same connection (read more about how it works). This unique session design enables low latency and supports unique features, but can also introduce challenges, like session time limits, and early termination. This guide covers strategies for overcoming the session management challenges that can arise when using the Live API.

Session lifetime
Without compression, audio-only sessions are limited to 15 minutes, and audio-video sessions are limited to 2 minutes. Exceeding these limits will terminate the session (and therefore, the connection), but you can use context window compression to extend sessions to an unlimited amount of time.

The lifetime of a connection is limited as well, to around 10 minutes. When the connection terminates, the session terminates as well. In this case, you can configure a single session to stay active over multiple connections using session resumption. You'll also receive a GoAway message before the connection ends, allowing you to take further actions.

Context window compression
To enable longer sessions, and avoid abrupt connection termination, you can enable context window compression by setting the contextWindowCompression field as part of the session configuration.

In the ContextWindowCompressionConfig, you can configure a sliding-window mechanism and the number of tokens that triggers compression.

Python
JavaScript

const config = {
  responseModalities: [Modality.AUDIO],
  contextWindowCompression: { slidingWindow: {} }
};
Session resumption
To prevent session termination when the server periodically resets the WebSocket connection, configure the sessionResumption field within the setup configuration.

Passing this configuration causes the server to send SessionResumptionUpdate messages, which can be used to resume the session by passing the last resumption token as the SessionResumptionConfig.handle of the subsequent connection.

Resumption tokens are valid for 2 hr after the last sessions termination.

Python
JavaScript

import { GoogleGenAI, Modality } from '@google/genai';

const ai = new GoogleGenAI({});
const model = 'gemini-2.5-flash-native-audio-preview-09-2025';

async function live() {
  const responseQueue = [];

  async function waitMessage() {
    let done = false;
    let message = undefined;
    while (!done) {
      message = responseQueue.shift();
      if (message) {
        done = true;
      } else {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    return message;
  }

  async function handleTurn() {
    const turns = [];
    let done = false;
    while (!done) {
      const message = await waitMessage();
      turns.push(message);
      if (message.serverContent && message.serverContent.turnComplete) {
        done = true;
      }
    }
    return turns;
  }

console.debug('Connecting to the service with handle %s...', previousSessionHandle)
const session = await ai.live.connect({
  model: model,
  callbacks: {
    onopen: function () {
      console.debug('Opened');
    },
    onmessage: function (message) {
      responseQueue.push(message);
    },
    onerror: function (e) {
      console.debug('Error:', e.message);
    },
    onclose: function (e) {
      console.debug('Close:', e.reason);
    },
  },
  config: {
    responseModalities: [Modality.AUDIO],
    sessionResumption: { handle: previousSessionHandle }
    // The handle of the session to resume is passed here, or else null to start a new session.
  }
});

const inputTurns = 'Hello how are you?';
session.sendClientContent({ turns: inputTurns });

const turns = await handleTurn();
for (const turn of turns) {
  if (turn.sessionResumptionUpdate) {
    if (turn.sessionResumptionUpdate.resumable && turn.sessionResumptionUpdate.newHandle) {
      let newHandle = turn.sessionResumptionUpdate.newHandle
      // ...Store newHandle and start new session with this handle here
    }
  }
}

  session.close();
}

async function main() {
  await live().catch((e) => console.error('got error', e));
}

main();
Receiving a message before the session disconnects
The server sends a GoAway message that signals that the current connection will soon be terminated. This message includes the timeLeft, indicating the remaining time and lets you take further action before the connection will be terminated as ABORTED.

Python
JavaScript

const turns = await handleTurn();

for (const turn of turns) {
  if (turn.goAway) {
    console.debug('Time left: %s\n', turn.goAway.timeLeft);
  }
}
Receiving a message when the generation is complete
The server sends a generationComplete message that signals that the model finished generating the response.

Python
JavaScript

const turns = await handleTurn();

for (const turn of turns) {
  if (turn.serverContent && turn.serverContent.generationComplete) {
    // The generation is complete
  }
}



Tool use with Live API

content_copy


Tool use allows Live API to go beyond just conversation by enabling it to perform actions in the real-world and pull in external context while maintaining a real time connection. You can define tools such as Function calling and Google Search with the Live API.

Overview of supported tools
Here's a brief overview of the available tools for Live API models:

Tool	gemini-2.5-flash-native-audio-preview-09-2025
Search	Yes
Function calling	Yes
Google Maps	No
Code execution	No
URL context	No
Function calling
Live API supports function calling, just like regular content generation requests. Function calling lets the Live API interact with external data and programs, greatly increasing what your applications can accomplish.

You can define function declarations as part of the session configuration. After receiving tool calls, the client should respond with a list of FunctionResponse objects using the session.send_tool_response method.

See the Function calling tutorial to learn more.

Note: Unlike the generateContent API, the Live API doesn't support automatic tool response handling. You must handle tool responses manually in your client code.
Python
JavaScript

import { GoogleGenAI, Modality } from '@google/genai';
import * as fs from "node:fs";
import pkg from 'wavefile';  // npm install wavefile
const { WaveFile } = pkg;

const ai = new GoogleGenAI({});
const model = 'gemini-2.5-flash-native-audio-preview-09-2025';

// Simple function definitions
const turn_on_the_lights = { name: "turn_on_the_lights" } // , description: '...', parameters: { ... }
const turn_off_the_lights = { name: "turn_off_the_lights" }

const tools = [{ functionDeclarations: [turn_on_the_lights, turn_off_the_lights] }]

const config = {
  responseModalities: [Modality.AUDIO],
  tools: tools
}

async function live() {
  const responseQueue = [];

  async function waitMessage() {
    let done = false;
    let message = undefined;
    while (!done) {
      message = responseQueue.shift();
      if (message) {
        done = true;
      } else {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    return message;
  }

  async function handleTurn() {
    const turns = [];
    let done = false;
    while (!done) {
      const message = await waitMessage();
      turns.push(message);
      if (message.serverContent && message.serverContent.turnComplete) {
        done = true;
      } else if (message.toolCall) {
        done = true;
      }
    }
    return turns;
  }

  const session = await ai.live.connect({
    model: model,
    callbacks: {
      onopen: function () {
        console.debug('Opened');
      },
      onmessage: function (message) {
        responseQueue.push(message);
      },
      onerror: function (e) {
        console.debug('Error:', e.message);
      },
      onclose: function (e) {
        console.debug('Close:', e.reason);
      },
    },
    config: config,
  });

  const inputTurns = 'Turn on the lights please';
  session.sendClientContent({ turns: inputTurns });

  let turns = await handleTurn();

  for (const turn of turns) {
    if (turn.toolCall) {
      console.debug('A tool was called');
      const functionResponses = [];
      for (const fc of turn.toolCall.functionCalls) {
        functionResponses.push({
          id: fc.id,
          name: fc.name,
          response: { result: "ok" } // simple, hard-coded function response
        });
      }

      console.debug('Sending tool response...\n');
      session.sendToolResponse({ functionResponses: functionResponses });
    }
  }

  // Check again for new messages
  turns = await handleTurn();

  // Combine audio data strings and save as wave file
  const combinedAudio = turns.reduce((acc, turn) => {
      if (turn.data) {
          const buffer = Buffer.from(turn.data, 'base64');
          const intArray = new Int16Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / Int16Array.BYTES_PER_ELEMENT);
          return acc.concat(Array.from(intArray));
      }
      return acc;
  }, []);

  const audioBuffer = new Int16Array(combinedAudio);

  const wf = new WaveFile();
  wf.fromScratch(1, 24000, '16', audioBuffer);  // output is 24kHz
  fs.writeFileSync('audio.wav', wf.toBuffer());

  session.close();
}

async function main() {
  await live().catch((e) => console.error('got error', e));
}

main();
From a single prompt, the model can generate multiple function calls and the code necessary to chain their outputs. This code executes in a sandbox environment, generating subsequent BidiGenerateContentToolCall messages.

Asynchronous function calling
Function calling executes sequentially by default, meaning execution pauses until the results of each function call are available. This ensures sequential processing, which means you won't be able to continue interacting with the model while the functions are being run.

If you don't want to block the conversation, you can tell the model to run the functions asynchronously. To do so, you first need to add a behavior to the function definitions:

Python
JavaScript

import { GoogleGenAI, Modality, Behavior } from '@google/genai';

// Non-blocking function definitions
const turn_on_the_lights = {name: "turn_on_the_lights", behavior: Behavior.NON_BLOCKING}

// Blocking function definitions
const turn_off_the_lights = {name: "turn_off_the_lights"}

const tools = [{ functionDeclarations: [turn_on_the_lights, turn_off_the_lights] }]
NON-BLOCKING ensures the function runs asynchronously while you can continue interacting with the model.

Then you need to tell the model how to behave when it receives the FunctionResponse using the scheduling parameter. It can either:

Interrupt what it's doing and tell you about the response it got right away (scheduling="INTERRUPT"),
Wait until it's finished with what it's currently doing (scheduling="WHEN_IDLE"),
Or do nothing and use that knowledge later on in the discussion (scheduling="SILENT")

Python
JavaScript

import { GoogleGenAI, Modality, Behavior, FunctionResponseScheduling } from '@google/genai';

// for a non-blocking function definition, apply scheduling in the function response:
const functionResponse = {
  id: fc.id,
  name: fc.name,
  response: {
    result: "ok",
    scheduling: FunctionResponseScheduling.INTERRUPT  // Can also be WHEN_IDLE or SILENT
  }
}

Combining multiple tools
You can combine multiple tools within the Live API, increasing your application's capabilities even more:

Python
JavaScript

const prompt = `Hey, I need you to do two things for me.

1. Use Google Search to look up information about the largest earthquake in California the week of Dec 5 2024?
2. Then turn on the lights

Thanks!
`

const tools = [
  { googleSearch: {} },
  { functionDeclarations: [turn_on_the_lights, turn_off_the_lights] }
]

const config = {
  responseModalities: [Modality.AUDIO],
  tools: tools
}

// ... remaining model call

