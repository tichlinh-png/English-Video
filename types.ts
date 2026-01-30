
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
  submissionLink?: string;
  submissionLink2?: string;
}

export type MediaState = {
  file: File | null;
  previewUrl: string | null;
  type: 'audio' | 'video' | null;
  file2?: File | null;
  previewUrl2?: string | null;
  type2?: 'audio' | 'video' | null;
};

export interface HistoryItem {
  id: string;
  timestamp: number;
  result: AnalysisResult;
  intendedText: string;
  mediaType: 'audio' | 'video' | null;
  submissionLink?: string;
  submissionLink2?: string;
}