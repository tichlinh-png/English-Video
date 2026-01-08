
import React from 'react';
import { AnalysisResult, MediaState } from '../types';
import { ScoreCard } from './ScoreCard';

interface ResultDisplayProps {
  result: AnalysisResult;
  media: MediaState;
  intendedText?: string;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, media, intendedText }) => {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Player Card */}
      <div className="bg-white p-5 rounded-[40px] shadow-2xl shadow-indigo-100/50 border border-white overflow-hidden">
        <div className="w-full rounded-[30px] overflow-hidden bg-slate-900 aspect-video flex items-center justify-center relative">
          {media.type === 'video' ? (
            <video controls src={media.previewUrl || ''} className="max-h-full" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-500 p-12 text-center">
              <div className="bg-white/20 backdrop-blur-xl rounded-full p-8 mb-6 animate-pulse">
                <span className="text-6xl">🎙️</span>
              </div>
              <audio controls src={media.previewUrl || ''} className="w-full max-w-sm h-10 invert brightness-200" />
            </div>
          )}
        </div>
      </div>

      {/* Scores Bubbles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <ScoreCard label="Tổng quát" score={result.scores.overall} color="text-indigo-600" />
        <ScoreCard label="Phát âm" score={result.scores.accuracy} color="text-purple-600" />
        <ScoreCard label="Trôi chảy" score={result.scores.fluency} color="text-sky-600" />
        <ScoreCard label="Ngữ điệu" score={result.scores.intonation} color="text-violet-600" />
      </div>

      {/* Comparison Section (Only if intended text exists) */}
      {(intendedText || result.suggestedText) && (
        <section className="bg-white p-8 md:p-10 rounded-[40px] shadow-sm border border-indigo-50 space-y-6">
          <h3 className="text-xl font-bold text-indigo-900 flex items-center gap-3">
            <span className="bg-indigo-100 p-2 rounded-xl">🔍</span> So sánh & Sửa lỗi
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {intendedText && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Câu bạn định nói</span>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-500 italic">
                    {intendedText}
                  </div>
                </div>
              )}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest ml-1">Lời bạn thực sự nói</span>
                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 text-indigo-700 font-bold">
                  {result.transcript}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {result.suggestedText && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest ml-1">Gợi ý hoàn hảo nhất ✨</span>
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-700 font-bold shadow-sm shadow-emerald-100">
                    {result.suggestedText}
                  </div>
                </div>
              )}
              {result.comparisonFeedback && (
                <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 text-purple-700 text-sm font-medium leading-relaxed">
                  <span className="block font-bold text-[9px] uppercase mb-1">Nhận xét cấu trúc:</span>
                  {result.comparisonFeedback}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Main Analysis Results */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white p-8 md:p-10 rounded-[40px] shadow-sm border border-indigo-50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700"></div>
            <h3 className="text-xl font-bold text-indigo-900 mb-6 flex items-center gap-3">
              <span className="bg-indigo-100 p-2 rounded-xl">📝</span> Đánh giá tổng hợp
            </h3>
            <div className="text-lg text-slate-600 leading-relaxed font-medium whitespace-pre-wrap relative">
              {result.summary}
            </div>
          </section>

          {!intendedText && (
             <section className="bg-indigo-600 p-10 rounded-[40px] shadow-xl shadow-indigo-200 text-white">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                  <span>🎙️</span> Lời bạn nói là:
                </h3>
                <p className="text-2xl font-bold italic leading-relaxed opacity-90">
                  "{result.transcript}"
                </p>
             </section>
          )}
        </div>

        {/* Word Corrections */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-indigo-900 px-4 flex items-center gap-3">
            <span className="bg-purple-100 p-2 rounded-xl">💡</span> Lỗi phát âm
          </h3>
          <div className="space-y-4">
            {result.details.length > 0 ? (
              result.details.map((item, idx) => (
                <div key={idx} className="bg-white p-6 rounded-[32px] shadow-sm border border-indigo-50 hover:border-indigo-300 transition-all group">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-slate-800 text-xl group-hover:text-indigo-600 transition-colors">{item.word}</span>
                    <span className="text-[10px] font-black bg-indigo-50 px-3 py-1.5 rounded-xl text-indigo-400 tracking-wider">/{item.phonetic}/</span>
                  </div>
                  <p className="text-xs text-rose-500 font-bold mb-4 bg-rose-50/50 px-3 py-1.5 rounded-full inline-block">⚠️ {item.issue}</p>
                  <div className="text-sm text-indigo-700 bg-indigo-50/30 p-5 rounded-[24px] border border-indigo-100/50 font-medium leading-relaxed">
                    <span className="block font-black text-[9px] uppercase text-indigo-400 mb-2 tracking-widest">Cách sửa:</span>
                    {item.suggestion}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center bg-emerald-50 border-4 border-dashed border-emerald-100 rounded-[40px] flex flex-col items-center space-y-4">
                <span className="text-5xl">🥳</span>
                <p className="text-emerald-700 font-bold text-lg leading-tight">Tuyệt đỉnh! <br/><span className="text-sm font-medium opacity-70">Mọi từ đều chuẩn xác.</span></p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
