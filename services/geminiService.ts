import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, FeedbackDetail } from "../types";

export const analyzePronunciation = async (
  file1: File | null,
  intendedText?: string,
  editedTranscript?: string,
  link1?: string,
  file2?: File | null,
  link2?: string
): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

  let parts: any[] = [];
  
  const hasTwoInputs = !!(file2 || link2);

  const prompt = `
    Bạn là một chuyên gia ngôn ngữ học và giáo viên tiếng Anh bản ngữ (Native English Speaker) tên là Caitlin.
    
    BỐI CẢNH:
    Bạn sẽ nhận được ${hasTwoInputs ? "HAI (2) bài nói (Attempt 1 và Attempt 2)" : "một bài nói"} của cùng một học sinh.
    
    DỮ LIỆU ĐẦU VÀO:
    ${intendedText ? `1. Câu mẫu mục tiêu: "${intendedText}"` : ""}
    ${editedTranscript ? `2. Văn bản con thực sự nói (Transcript tham khảo): "${editedTranscript}"` : ""}
    ${link1 ? `3. Link bài nộp 1: "${link1}"` : ""}
    ${link2 ? `4. Link bài nộp 2: "${link2}"` : ""}
    
    NHIỆM VỤ:
    1. Trả về Transcript chính xác nhất (nếu có 2 bài, ưu tiên lấy transcript của bài tốt hơn hoặc kết hợp).
    2. Chấm điểm (0-100): Dựa trên màn thể hiện tốt nhất của học sinh.
    3. Liệt kê lỗi chi tiết.
    4. Viết Summary (Nhận xét) BẮT BUỘC THEO ĐÚNG MẪU SAU:

    --- MẪU NHẬN XÉT BẮT BUỘC ---
    Cô nhận xét ${hasTwoInputs ? "quá trình luyện tập" : "video bài đọc"} của con:

    - Phát âm: 
      [MỞ ĐẦU BẮT BUỘC]: "${link1 ? "Cô đã xem bài con gửi." : ""} ${hasTwoInputs ? "Cô rất vui vì con đã chăm chỉ luyện tập 2 lần nhé!" : "Viết 1 câu khen ngợi ngắn gọn."}"
      [NỘI DUNG CHÍNH]:
      ${hasTwoInputs ? "So sánh Lần 1 và Lần 2. Khen ngợi sự tiến bộ ở Lần 2 (ví dụ: đã sửa được âm cuối, đọc trôi chảy hơn...). Tuy nhiên, vẫn cần lưu ý..." : "Nêu lỗi phổ biến nhất cần sửa..."}

      + Từ "[từ]" (/[IPA chuẩn]/): [Mô tả lỗi sai cụ thể]. 
      + Từ "[từ]" (/[IPA chuẩn]/): [Mô tả lỗi sai cụ thể].
      ... (Liệt kê các lỗi sai điển hình nhất)

    - Ngữ điệu:
      + Điểm tốt: [Phân tích chi tiết điểm tích cực của riêng bài nói này. Ví dụ: giọng con rất vang, hoặc con đã biết lên giọng ở câu hỏi...].
      + Cần khắc phục: [Chỉ ra chỗ cụ thể bị ngang hoặc sai ngữ điệu. Ví dụ: câu "..." con đọc hơi đều, cần nhấn vào từ "..." và "..."].

    Con chú ý luyện đọc lại theo bài mẫu nhé.
    --------------------------------

    YÊU CẦU FORMATTING QUAN TRỌNG:
    - Ngôn ngữ: Tiếng Việt.
    - TUYỆT ĐỐI KHÔNG sử dụng thẻ HTML như <br>. Sử dụng dấu xuống dòng (\n) thực tế.
    - Có thể sử dụng **in đậm** (Markdown).
    - Dùng dấu cộng (+) đầu dòng cho danh sách từ sai hoặc các ý trong mục ngữ điệu.
  `;

  parts.push({ text: prompt });

  // Process File 1
  if (file1) {
    const base64Data1 = await fileToBase64(file1);
    parts.push({ text: "--- MEDIA DATA 1 (Lần 1) ---" });
    parts.push({
      inlineData: {
        mimeType: file1.type || "audio/webm",
        data: base64Data1
      }
    });
  }

  // Process File 2 if exists
  if (file2) {
    const base64Data2 = await fileToBase64(file2);
    parts.push({ text: "--- MEDIA DATA 2 (Lần 2 - So sánh sự tiến bộ) ---" });
    parts.push({
      inlineData: {
        mimeType: file2.type || "audio/webm",
        data: base64Data2
      }
    });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          transcript: { type: Type.STRING },
          suggestedText: { type: Type.STRING },
          comparisonFeedback: { type: Type.STRING },
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

  const result = JSON.parse(resultText) as AnalysisResult;
  
  if (link1) result.submissionLink = link1;
  if (link2) result.submissionLink2 = link2;
  
  return result;
};

// Helper function
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const regenerateSummary = async (
  transcript: string,
  scores: any,
  details: FeedbackDetail[],
  intendedText?: string,
  submissionLink?: string,
  submissionLink2?: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  
  const hasTwoInputs = !!(submissionLink || submissionLink2); // Approximation if we don't have file info here, but usually links persist

  const errorList = details
    .map((d) => `+ Từ "${d.word}" (/${d.phonetic}/): ${d.issue}`)
    .join("\n");

  const prompt = `
    Bạn là giáo viên tiếng Anh Caitlin. Hãy viết lại nhận xét cho bài nói này.

    THÔNG TIN:
    - Transcript: "${transcript}"
    - Điểm: ${scores.overall}/100
    - Link 1: ${submissionLink || "N/A"}
    - Link 2: ${submissionLink2 || "N/A"}
    - Lỗi sai:
    ${errorList}

    YÊU CẦU: Viết lại nhận xét TUÂN THỦ ĐÚNG MẪU:

    Cô nhận xét ${submissionLink2 ? "quá trình luyện tập" : "video bài đọc"} của con:

    - Phát âm: [${submissionLink ? "Cô đã xem bài con gửi." : ""} ${submissionLink2 ? "Khen ngợi nỗ lực làm 2 lần và sự tiến bộ." : "Khen ngợi chung."}] Tuy nhiên, [nêu lỗi chính].

      ${errorList}

    - Ngữ điệu:
      + Điểm tốt: [Nêu điểm tốt cụ thể về ngữ điệu của học sinh].
      + Cần khắc phục: [Nêu điểm cần sửa cụ thể về ngữ điệu kèm ví dụ].

    Con chú ý luyện đọc lại theo bài mẫu nhé.

    LƯU Ý FORMATTING:
    - Dùng \n để xuống dòng, \n\n để tách đoạn.
    - Dùng **in đậm** cho từ quan trọng.
    - KHÔNG dùng thẻ HTML.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "text/plain",
    }
  });

  return response.text || "Không thể tạo lại nhận xét.";
};