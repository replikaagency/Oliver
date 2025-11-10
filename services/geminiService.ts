import { GoogleGenAI, FunctionDeclaration, Type, Modality, Chat } from "@google/genai";
import { SYSTEM_INSTRUCTION } from '../constants';
import type { Message } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const generateTechnicalDrawingTool: FunctionDeclaration = {
  name: 'generate_technical_drawing',
  description: 'Generates a simple 2D black and white technical drawing based on a descriptive prompt. Use this to visually illustrate geometric concepts for the user.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      description: {
        type: Type.STRING,
        description: 'A detailed English prompt for the image generation model. Should describe a simple, 2D, black and white schematic.',
      },
    },
    required: ['description'],
  },
};

const generateCreativeImageTool: FunctionDeclaration = {
  name: 'generate_creative_image',
  description: 'Generates a high-quality, creative image based on a user prompt. Use this for non-technical, artistic image requests.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      prompt: {
        type: Type.STRING,
        description: 'A detailed English prompt describing the desired creative image.'
      }
    },
    required: ['prompt']
  }
}

const chat: Chat = ai.chats.create({
  model: 'gemini-2.5-flash',
  config: {
    systemInstruction: SYSTEM_INSTRUCTION,
    tools: [{ functionDeclarations: [generateTechnicalDrawingTool, generateCreativeImageTool] }],
  },
});

const generateTechnicalImage = async (prompt: string): Promise<string> => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: { responseModalities: [Modality.IMAGE] },
    });
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error('No image data found in technical drawing response.');
};

const generateCreativeImage = async (prompt: string): Promise<string> => {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: { numberOfImages: 1 }
    });
    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    return `data:image/png;base64,${base64ImageBytes}`;
}

async function* runMultiModalStream(prompt: string, image: { data: string; mimeType: string }): AsyncGenerator<Partial<Message>> {
    try {
        const responseStream = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { inlineData: { data: image.data, mimeType: image.mimeType } },
                    { text: prompt }
                ]
            }
        });

        for await (const chunk of responseStream) {
            let chunkMessage: Partial<Message> = { role: 'assistant' };
            if (chunk.text) {
                chunkMessage.content = chunk.text;
            }
            for (const part of chunk.candidates?.[0]?.content?.parts ?? []) {
                if (part.inlineData) {
                    chunkMessage.imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
             if(chunkMessage.content || chunkMessage.imageUrl){
                yield chunkMessage;
            }
        }

    } catch (error) {
        console.error("Gemini API multimodal stream error:", error);
        yield { role: 'assistant', content: "Lo siento, ha ocurrido un error al procesar tu solicitud con la imagen." };
    }
}


async function* runChatStream(prompt: string, history: Message[]): AsyncGenerator<Partial<Message>> {
  try {
    const responseStream = await chat.sendMessageStream({ message: prompt });

    for await (const chunk of responseStream) {
      const functionCalls = chunk.functionCalls;
      
      if (functionCalls && functionCalls.length > 0) {
        for (const funcCall of functionCalls) {
          try {
              if (funcCall.name === 'generate_technical_drawing') {
                yield { role: 'assistant', content: 'Entendido. Generando un esquema técnico...' };
                const { description } = funcCall.args;
                const imageUrl = await generateTechnicalImage(description);
                yield { role: 'assistant', content: '', imageUrl };
              }
              if (funcCall.name === 'generate_creative_image') {
                yield { role: 'assistant', content: 'Entendido. Generando una imagen creativa...' };
                const { prompt } = funcCall.args;
                const imageUrl = await generateCreativeImage(prompt);
                yield { role: 'assistant', content: '', imageUrl };
              }
          } catch (e) {
               yield { role: 'assistant', content: `Lo siento, hubo un error al generar la imagen. (${(e as Error).message})` };
          }
        }
      } else if (chunk.text) {
        yield { role: 'assistant', content: chunk.text };
      }
    }
  } catch (error) {
    console.error("Gemini API chat stream error:", error);
    yield { role: 'assistant', content: "Lo siento, ha ocurrido un error al procesar tu solicitud." };
  }
}

export function runStream(
    prompt: string, 
    history: Message[], 
    image?: { data: string; mimeType: string }
): AsyncGenerator<Partial<Message>> {
    if (image) {
        return runMultiModalStream(prompt, image);
    } else {
        return runChatStream(prompt, history);
    }
}