import Groq from "groq-sdk";

// Initialize Groq SDK
// Note: dangerouslyAllowBrowser is required for client-side usage.
const groq = new Groq({
    apiKey: import.meta.env.VITE_GROQ_API_KEY || "", // Use empty string to avoid crash if key is missing initially
    dangerouslyAllowBrowser: true
});

// Chat Completion
// We use 'llama-3.3-70b-versatile' for the assistant as it is the most capable chat model.
// Note: 'llama-guard' models are for safety classification and cannot hold a conversation.
// Llama 3.3 also has very high rate limits on Groq.
export const getGroqChatCompletion = async (messages: any[]) => {
    try {
        const completion = await groq.chat.completions.create({
            messages: messages,
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            max_tokens: 1024,
        });

        return completion.choices[0]?.message?.content || "";
    } catch (error) {
        console.error("Groq Chat Error:", error);
        throw error;
    }
};

// Audio Transcription (Whisper)
export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    try {
        // Create a File object from the Blob (Groq SDK expects a File)
        const audioFile = new File([audioBlob], "recording.webm", { type: "audio/webm" });

        const translation = await groq.audio.transcriptions.create({
            file: audioFile,
            model: "whisper-large-v3",
            response_format: "json",
        });

        return translation.text;
    } catch (error) {
        console.error("Groq Whisper Error:", error);
        throw error;
    }
};

// Vision
export const generateImageCaption = async (imageBase64: string, prompt: string): Promise<string> => {
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:image/jpeg;base64,${imageBase64}`,
                            },
                        },
                    ],
                },
            ],
            model: "llama-3.2-11b-vision-preview",
            temperature: 0.7,
            max_tokens: 500,
        });

        return completion.choices[0]?.message?.content || "";
    } catch (error) {
        console.error("Groq Vision Error:", error);
        throw error;
    }
};
