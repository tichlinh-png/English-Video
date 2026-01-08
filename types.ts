
export interface PronunciationScore {
  accuracy: number;
  fluency: number;
  intonation: number;
  overall: number;
}

export interface FeedbackDetail {
  word: string;
  phonetic: string;
  issue: string;
  suggestion: string;
}

export interface AnalysisResult {
  transcript: string;
  suggestedText?: string;
  comparisonFeedback?: string;
  scores: PronunciationScore;
  details: FeedbackDetail[];
  summary: string;
}

export type MediaState = {
  file: File | null;
  previewUrl: string | null;
  type: 'audio' | 'video' | null;
};
