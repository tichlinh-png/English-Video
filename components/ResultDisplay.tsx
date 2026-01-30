import React, { useState, useMemo, useEffect } from 'react';
import { AnalysisResult, MediaState, FeedbackDetail } from '../types';
import { ScoreCard } from './ScoreCard';
import { analyzePronunciation, regenerateSummary } from '../services/geminiService';

interface ResultDisplayProps {
  result: AnalysisResult;
  media: MediaState;
  intendedText?: string;
  onUpdateResult: (newResult: AnalysisResult) => void;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, media, intendedText, onUpdateResult }) => {
  const [editableTranscript, setEditableTranscript] = useState(result.transcript);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [copied, setCopied] = useState(false);

  // Feedback versioning state
  const [feedbackVersions, setFeedbackVersions] = useState<string[]>([result.summary]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(0);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Feedback Editing State
  const [isEditingFeedback, setIsEditingFeedback] = useState(false);
  const [editedFeedback, setEditedFeedback] = useState(result.summary);

  // Toggle for detailed error list in summary
  const [showDetails, setShowDetails] = useState(false);

  // Sync when result changes entirely (e.g. new file upload)
  useEffect(() => {
    if (!feedbackVersions.includes(result.summary)) {
      setFeedbackVersions([result.summary]);
      setCurrentVersionIndex(0);
      setEditedFeedback(result.summary);
      setShowDetails(false); // Reset details view on new result
    }
  }, [result.summary]);

  const handleCopy = async () => {
    try {
      const rawText = feedbackVersions[currentVersionIndex];
      const htmlContent = rawText
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      const plainTextContent = rawText.replace(/\*\*/g, '');

      const typeHtml = 'text/html';
      const typeText = 'text/plain';
      
      const blobHtml = new Blob([htmlContent], { type: typeHtml });
      const blobText = new Blob([plainTextContent], { type: typeText });

      const data = [new ClipboardItem({
        [typeHtml]: blobHtml,
        [typeText]: blobText
      })];

      await navigator.clipboard.write(data);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Lỗi khi copy rich text:", err);
      try {
        const rawText = feedbackVersions[currentVersionIndex];
        const cleanText = rawText.replace(/\*\*/g, '');
        await navigator.clipboard.writeText(cleanText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (e) {
        console.error("Fallback copy failed:", e);
      }
    }
  };

  const handleReanalyze = async () => {
    if (!media.file) {
      alert("Con ơi, đây là bài học cũ trong lịch sử, không thể chấm điểm lại từ tệp gốc được nhé! 💜");
      return;
    }
    setIsUpdating(true);
    try {
      const newResult = await analyzePronunciation(
        media.file, 
        intendedText, 
        editableTranscript, 
        result.submissionLink,
        media.file2,
        result.submissionLink2
      );
      onUpdateResult(newResult);
      setShowEditor(false);
    } catch (err) {
      alert("Có lỗi khi cập nhật đánh giá rồi Con ơi! 😿");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRegenerateFeedback = async () => {
    setIsRegenerating(true);
    try {
      const newSummary = await regenerateSummary(
        result.transcript, 
        result.scores, 
        result.details, 
        intendedText,
        result.submissionLink,
        result.submissionLink2
      );
      
      const newVersions = [...feedbackVersions, newSummary];
      setFeedbackVersions(newVersions);
      const newIndex = newVersions.length - 1;
      setCurrentVersionIndex(newIndex);
      setEditedFeedback(newSummary);
      
      onUpdateResult({ ...result, summary: newSummary });
    } catch (err) {
      console.error(err);
      alert("Cô chưa nghĩ ra nhận xét mới ngay được, con thử lại xíu nhé! 🤯");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleVersionChange = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' ? currentVersionIndex - 1 : currentVersionIndex + 1;
    if (newIndex >= 0 && newIndex < feedbackVersions.length) {
      setCurrentVersionIndex(newIndex);
      setEditedFeedback(feedbackVersions[newIndex]);
      onUpdateResult({ ...result, summary: feedbackVersions[newIndex] });
    }
  };

  const handleSaveFeedbackEdit = () => {
    const newVersions = [...feedbackVersions, editedFeedback];
    setFeedbackVersions(newVersions);
    setCurrentVersionIndex(newVersions.length - 1);
    onUpdateResult({ ...result, summary: editedFeedback });
    setIsEditingFeedback(false);
  };

  const renderFormattedFeedback = (text: string) => {
    const cleanText = text.replace(/<br\s*\/?>/gi, '\n');
    const lines = cleanText.split('\n');
    return lines.map((line, lineIdx) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <div key={lineIdx} className={`${line.trim() === '' ? 'h-4' : ''}`}>
          {parts.map((part, partIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={partIdx} className="text-indigo-900 font-black">{part.slice(2, -2)}</strong>;
            }
            return <span key={partIdx}>{part}</span>;
          })}
        </div>
      );
    });
  };

  const highlightedTranscript = useMemo(() => {
    const words = editableTranscript.split(/(\s+)/);
    const errorWordsMap = new Map<string, FeedbackDetail>();
    result.details.forEach(d => errorWordsMap.set(d.word.toLowerCase().trim(), d));

    return words.map((part, index) => {
      const cleanWord = part.toLowerCase().replace(/[.,!?;:]/g, '').trim();
      const detail = errorWordsMap.get(cleanWord);

      if (detail) {
        return (
          <span key={index} className="relative group cursor-help inline-block">
            <span className="text-rose-500 font-black underline decoration-rose-300 decoration-2 underline-offset-4 bg-rose-50 px-1 rounded-md transition-all group-hover:bg-rose-100">
              {part}
            </span>
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-slate-900 text-white text-[10px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
              <span className="block font-black text-rose-400 mb-1">Lỗi: {detail.issue}</span>
              <span className="block opacity-80">Gợi ý: {detail.suggestion}</span>
              <span className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></span>
            </span>
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  }, [editableTranscript, result.details]);

  const renderMediaPlayer = (previewUrl: string | null | undefined, type: string | null | undefined, link: string | undefined, label: string) => (
    <div className="bg-white p-5 rounded-[40px] shadow-2xl shadow-indigo-100/50 border border-white overflow-hidden flex-1">
      <div className="mb-2 pl-2">
         <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">{label}</span>
      </div>
      <div className="w-full rounded-[30px] overflow-hidden bg-slate-900 aspect-video flex items-center justify-center relative">
        {previewUrl ? (
          type === 'video' ? (
            <video controls src={previewUrl} className="max-h-full" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-500 p-12 text-center">
              <div className="bg-white/20 backdrop-blur-xl rounded-full p-8 mb-6 animate-float">
                <span className="text-4xl">🎙️</span>
              </div>
              <audio controls src={previewUrl} className="w-full max-w-sm h-10 invert brightness-200" />
            </div>
          )
        ) : (
          <div className="flex flex-col items-center text-center p-8">
            <span className="text-4xl mb-4">📜</span>
            <p className="text-indigo-200 font-bold">Lịch sử / Link ngoài</p>
            {link && (
               <a href={link} target="_blank" rel="noopener noreferrer" className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold border border-indigo-100 hover:bg-indigo-100 transition-colors">
                  Xem link gốc 🔗
               </a>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Player Cards - Stack on mobile, side-by-side on desktop */}
      <div className="flex flex-col md:flex-row gap-6">
         {renderMediaPlayer(media.previewUrl, media.type, result.submissionLink, "Lần 1")}
         {/* Only show player 2 if there's a file or link for it */}
         {(media.previewUrl2 || result.submissionLink2) && renderMediaPlayer(media.previewUrl2, media.type2 || media.type, result.submissionLink2, "Lần 2")}
      </div>

      {/* Scores Bubbles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <ScoreCard label="Tổng quát" score={result.scores.overall} color="text-indigo-600" />
        <ScoreCard label="Phát âm" score={result.scores.accuracy} color="text-rose-500" />
        <ScoreCard label="Trôi chảy" score={result.scores.fluency} color="text-sky-500" />
        <ScoreCard label="Ngữ điệu" score={result.scores.intonation} color="text-purple-500" />
      </div>

      {/* Teacher's Feedback Section */}
      <section className="bg-white p-6 md:p-12 rounded-[48px] shadow-2xl shadow-indigo-100/30 border-2 border-indigo-50 relative overflow-hidden transition-all">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full -mr-32 -mt-32 blur-3xl opacity-60"></div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-indigo-200 animate-float">👩‍🏫</div>
              <div>
                <h3 className="text-2xl font-black text-indigo-900">Bảng Nhận Xét Của Cô</h3>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Phân tích kỹ thuật & Khen ngợi nỗ lực</p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {!isEditingFeedback ? (
                <>
                  {feedbackVersions.length > 1 && (
                    <div className="flex items-center bg-indigo-50/50 rounded-xl p-1 border border-indigo-100 mr-2">
                      <button 
                        onClick={() => handleVersionChange('prev')}
                        disabled={currentVersionIndex === 0}
                        className="p-2 rounded-lg hover:bg-white text-indigo-600 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <span className="text-xs font-bold text-indigo-900 px-2 min-w-[60px] text-center">
                        Bản {currentVersionIndex + 1}/{feedbackVersions.length}
                      </span>
                      <button 
                        onClick={() => handleVersionChange('next')}
                        disabled={currentVersionIndex === feedbackVersions.length - 1}
                        className="p-2 rounded-lg hover:bg-white text-indigo-600 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                      </button>
                    </div>
                  )}

                  <button 
                    onClick={() => setIsEditingFeedback(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-2xl font-bold text-xs transition-all hover:bg-indigo-100 active:scale-95"
                  >
                    <span>✏️</span> Sửa
                  </button>

                  <button 
                    onClick={handleRegenerateFeedback}
                    disabled={isRegenerating}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-2xl font-bold text-xs transition-all hover:bg-indigo-100 active:scale-95 disabled:opacity-50"
                  >
                    <span className={isRegenerating ? "animate-spin" : ""}>🔄</span>
                    {isRegenerating ? 'Đang viết...' : 'Làm mới'}
                  </button>

                  <button 
                    onClick={() => setShowDetails(!showDetails)}
                    disabled={!result.details || result.details.length === 0}
                    className={`flex items-center gap-2 px-4 py-2 border rounded-2xl font-bold text-xs transition-all active:scale-95 disabled:opacity-50
                      ${showDetails ? 'bg-indigo-100 text-indigo-700 border-indigo-200 shadow-inner' : 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100'}`}
                  >
                    <span>📋</span>
                    {showDetails ? 'Thu gọn' : 'Chi tiết lỗi'}
                  </button>

                  <button 
                    onClick={handleCopy}
                    className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-xs transition-all active:scale-95 shadow-sm
                      ${copied ? 'bg-emerald-500 text-white shadow-emerald-100' : 'bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-50'}`}
                  >
                    {copied ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                        Đã copy
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                        Copy
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={handleSaveFeedbackEdit}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white border border-indigo-600 rounded-2xl font-bold text-xs transition-all hover:bg-indigo-700 active:scale-95 shadow-lg shadow-indigo-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                    Lưu
                  </button>
                  <button 
                    onClick={() => {
                      setIsEditingFeedback(false);
                      setEditedFeedback(feedbackVersions[currentVersionIndex]);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-slate-500 border border-slate-200 rounded-2xl font-bold text-xs transition-all hover:bg-slate-50 active:scale-95"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                    Hủy
                  </button>
                </>
              )}
            </div>
          </div>
          
          <div className={`bg-white/80 backdrop-blur-sm p-6 md:p-10 rounded-[32px] border shadow-inner group relative min-h-[150px] transition-all
             ${isEditingFeedback ? 'border-indigo-300 ring-4 ring-indigo-50' : 'border-indigo-100/50'}`}>
            
            {isEditingFeedback ? (
              <textarea 
                value={editedFeedback}
                onChange={(e) => setEditedFeedback(e.target.value)}
                className="w-full h-full min-h-[300px] bg-transparent outline-none text-[17px] md:text-[19px] text-slate-800 leading-[1.8] font-semibold resize-none"
                autoFocus
                placeholder="Nhập nhận xét của cô tại đây..."
              />
            ) : (
              <div className="text-[17px] md:text-[19px] text-slate-700 leading-[1.8] font-semibold animate-in fade-in duration-500">
                {renderFormattedFeedback(feedbackVersions[currentVersionIndex])}
              </div>
            )}
            
            {showDetails && result.details.length > 0 && (
              <div className="mt-8 pt-6 border-t border-indigo-100/50 animate-in fade-in slide-in-from-top-4">
                <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4">Chi tiết lỗi ngữ âm:</h4>
                <div className="grid grid-cols-1 gap-3">
                  {result.details.map((item, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 bg-rose-50/40 p-3 rounded-2xl border border-rose-100/50 hover:bg-rose-50 transition-colors">
                       <div className="flex items-center gap-3 min-w-[140px]">
                         <span className="w-6 h-6 flex items-center justify-center bg-white rounded-full text-[10px] font-black text-rose-500 shadow-sm shrink-0 border border-rose-50">{idx + 1}</span>
                         <span className="font-bold text-slate-800 text-lg">{item.word}</span>
                       </div>
                       <span className="text-sm font-mono text-indigo-500 bg-indigo-50/50 px-2 py-1 rounded-lg border border-indigo-100 min-w-[80px] text-center">/{item.phonetic}/</span>
                       <span className="text-sm text-rose-600 font-medium leading-tight flex-1">{item.issue}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="bg-white p-8 md:p-10 rounded-[40px] shadow-sm border border-indigo-50 space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-indigo-900 flex items-center gap-3">
            <span className="bg-indigo-100 p-2 rounded-xl text-lg">🔍</span> Phân tích lời Con nói {!media.file && "(Lịch sử)"}
          </h3>
          {media.file && (
            <div className="flex gap-2">
              {!showEditor ? (
                <button 
                  onClick={() => setShowEditor(true)}
                  className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full text-xs font-bold hover:bg-indigo-100 transition-all border border-indigo-100"
                >
                  Sửa văn bản ✍️
                </button>
              ) : (
                <button 
                  onClick={handleReanalyze}
                  disabled={isUpdating}
                  className="bg-indigo-600 text-white px-5 py-2 rounded-full text-xs font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
                >
                  {isUpdating ? 'Đang chấm lại...' : 'Xác nhận & Chấm lại ✨'}
                </button>
              )}
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] ml-1">Lời Con đã nói (Bấm "Sửa" nếu AI nghe sai)</span>
            {showEditor ? (
              <textarea 
                value={editableTranscript}
                onChange={(e) => setEditableTranscript(e.target.value)}
                className="w-full p-6 bg-indigo-50/30 rounded-3xl border-2 border-indigo-100 text-indigo-900 font-bold focus:bg-white focus:border-indigo-400 outline-none transition-all resize-none text-lg leading-relaxed"
                rows={3}
                autoFocus
              />
            ) : (
              <div className="p-6 bg-white rounded-3xl border-2 border-slate-50 text-slate-700 font-bold text-lg leading-relaxed shadow-inner min-h-[100px]">
                {highlightedTranscript}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] ml-1">Câu mẫu chuẩn ✨</span>
            <div className="p-6 bg-emerald-50/50 rounded-3xl border-2 border-emerald-100 text-emerald-800 font-bold text-lg leading-relaxed shadow-sm shadow-emerald-50">
              {result.suggestedText || "Đang phân tích..."}
            </div>
          </div>
        </div>
      </section>

      {/* Word-by-word Errors */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-indigo-900 px-4 flex items-center gap-3">
          <span className="bg-rose-100 p-2 rounded-xl">📍</span> Các từ cần cải thiện
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {result.details.length > 0 ? (
            result.details.map((item, idx) => (
              <div key={idx} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-xl font-black text-slate-900">{item.word}</h4>
                    <span className="text-xs font-bold text-indigo-400">/{item.phonetic}/</span>
                  </div>
                  <div className="w-8 h-8 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center text-lg">⚠️</div>
                </div>
                <p className="text-xs font-bold text-rose-600 mb-3 bg-rose-50/30 p-3 rounded-2xl border border-rose-50">
                  {item.issue}
                </p>
                <div className="p-3 bg-indigo-50/20 rounded-2xl text-[11px] text-indigo-800 leading-relaxed font-medium italic">
                  "Con hãy {item.suggestion.toLowerCase()}"
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 p-10 text-center bg-emerald-50 border-4 border-dashed border-emerald-100 rounded-[40px] flex flex-col items-center space-y-4 animate-float">
              <span className="text-6xl">🏆</span>
              <p className="text-emerald-800 font-black text-xl leading-tight">Tuyệt vời! <br/><span className="text-sm font-bold opacity-70">Con đã phát âm rất sạch và rõ ràng từng âm một.</span></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};