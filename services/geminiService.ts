
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

export const analyzePronunciation = async (file: File, intendedText?: string): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const mimeType = file.type;

  const prompt = `
    Bạn là một chuyên gia ngôn ngữ và phát âm tiếng Anh. Hãy phân tích tệp ${mimeType.startsWith('video') ? 'video' : 'âm thanh'} đính kèm.
    
    ${intendedText ? `Học sinh đang cố gắng nói câu này: "${intendedText}"` : "Học sinh không cung cấp câu đích cụ thể."}
    
    Nhiệm vụ của bạn:
    1. Trích xuất chính xác văn bản (transcript) từ lời nói của học sinh.
    2. Nếu học sinh có cung cấp "câu dự kiến" (intendedText):
       - So sánh lời nói thực tế với câu dự kiến.
       - Chỉ ra các từ bị nói thiếu, nói sai hoặc các lỗi ngữ pháp/cấu trúc.
       - Đề xuất một "Câu hoàn chỉnh nhất" (suggestedText) dựa trên ý định của học sinh.
       - Cung cấp nhận xét về sự khác biệt này trong 'comparisonFeedback'.
    3. Chấm điểm 0-100 cho: Accuracy, Fluency, Intonation, Overall.
    4. Cung cấp phản hồi CHI TIẾT VÀ TOÀN BỘ BẰNG TIẾNG VIỆT:
       - 'summary': Đánh giá tổng quát về kỹ năng nói và các lỗi lặp lại.
       - 'details': Phân tích lỗi phát âm từng từ cụ thể (âm tiết, trọng âm).
       - 'suggestion': Hướng dẫn sửa lỗi chi tiết cho từng từ.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          transcript: { type: Type.STRING },
          suggestedText: { type: Type.STRING, description: "Phiên bản sửa lỗi ngữ pháp và từ vựng hoàn hảo nhất dựa trên ý định học sinh." },
          comparisonFeedback: { type: Type.STRING, description: "Giải thích sự khác biệt giữa câu dự kiến và câu thực tế nói ra bằng tiếng Việt." },
          scores: {
            type: Type.OBJECT,
            properties: {
              accuracy: { type: Type.NUMBER },
              fluency: { type: Type.NUMBER },
              intonation: { type: Type.NUMBER },
              overall: { type: Type.NUMBER }
            },
            required: ["accuracy", "fluency", "intonation", "overall"]
          },
          details: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING },
                phonetic: { type: Type.STRING },
                issue: { type: Type.STRING },
                suggestion: { type: Type.STRING }
              },
              required: ["word", "phonetic", "issue", "suggestion"]
            }
          },
          summary: { type: Type.STRING }
        },
        required: ["transcript", "scores", "details", "summary"]
      }
    }
  });

  const resultText = response.text;
  if (!resultText) throw new Error("Không nhận được kết quả phân tích.");

  return JSON.parse(resultText) as AnalysisResult;
};
