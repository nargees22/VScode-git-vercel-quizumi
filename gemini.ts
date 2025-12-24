import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import type { Question } from './types.ts';
import { QuestionType } from "./types.ts";

type AiGeneratedQuestion = Omit<Question, 'id' | 'type' | 'matchPairs' | 'correctAnswers' | 'organizerName' | 'creationTime'>;

interface AiResponse {
    questions: AiGeneratedQuestion[];
}

const schema = {
    type: Type.OBJECT,
    properties: {
        questions: {
            type: Type.ARRAY,
            description: 'A list of generated quiz questions.',
            items: {
                type: Type.OBJECT,
                properties: {
                    text: { type: Type.STRING, description: 'The question text.' },
                    options: {
                        type: Type.ARRAY,
                        description: 'An array of exactly 4 possible answers.',
                        items: { type: Type.STRING }
                    },
                    correctAnswerIndex: { type: Type.INTEGER, description: 'The 0-based index of the correct answer in the options array.' },
                    timeLimit: { type: Type.INTEGER, description: 'Time limit in seconds for the question. Default to 30 seconds.' },
                    technology: { type: Type.STRING, description: 'The main topic or technology of the question.' },
                    skill: { type: Type.STRING, description: 'The skill level or sub-topic.' }
                },
                required: ['text', 'options', 'correctAnswerIndex', 'timeLimit', 'technology', 'skill']
            }
        }
    },
    required: ['questions']
};

export async function generateQuestions(topic: string, skill: string, count: number): Promise<Omit<Question, 'id'>[]> {
    const ai = new GoogleGenAI({
      apiKey: process.env.API_KEY || '',
    });

    try {
        const prompt = `Generate ${count} unique, high-quality multiple-choice quiz questions for the topic "${topic}" at a "${skill}" skill level.
Each question must have exactly 4 options, with one clearly correct answer.
Assign a time limit of 30 seconds for each question.`;
        
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });

        const rawText = response.text || "{}";
        const jsonResult = JSON.parse(rawText) as any;
        
        let questionsList: AiGeneratedQuestion[] = [];
        if (jsonResult.questions) {
            questionsList = jsonResult.questions;
        }
        
        return questionsList.map((q) => ({ ...q, type: QuestionType.MCQ }));
    } catch (error) {
        console.error("Error generating questions:", error);
        throw new Error("Failed to generate questions with AI.");
    }
}