import React, { useState, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { ResultDisplay } from './components/ResultDisplay';
import { HistoryList } from './components/HistoryList';
import { analyzePronunciation } from './services/geminiService';
import { AnalysisResult, MediaState, HistoryItem } from './types';

const App: React.FC = () => {
  const [intendedText, setIntendedText] = useState('');
  const [media, setMedia] = useState<MediaState>({ file: null, previewUrl: null, type: null });
  const [link1, setLink1] = useState('');
  const [link2, setLink2] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'main' | 'history'>('main');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  
  const [liveUsers, setLiveUsers] = useState(0);
  const [totalVisits, setTotalVisits] = useState(0);

  // Load history from local storage
  useEffect(() => {
    const savedHistory = localStorage.getItem('english_pro_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Lỗi khi tải lịch sử:", e);
      }
    }

    const updateLiveUsers = () => {
      const now = new Date();
      const hour = now.getHours();
      let base = 5;
      if (hour >= 19 && hour <= 23) base = 12;
      else if (hour >= 1 && hour <= 5) base = 2;
      const fluctuation = Math.floor(Math.random() * 4);
      setLiveUsers(base + fluctuation);
    };

    updateLiveUsers();
    const liveInterval = setInterval(updateLiveUsers, 8000);

    const fetchVisits = async () => {
      try {
        const response = await fetch('https://api.counterapi.dev/v1/english_pro_caitlin/total/increment');
        if (response.ok) {
          const data = await response.json();
          setTotalVisits(data.value + 15240);
        } else {
          const saved = localStorage.getItem('total_visits_fallback') || '15240';
          const newVal = parseInt(saved) + 1;
          localStorage.setItem('total_visits_fallback', newVal.toString());
          setTotalVisits(newVal);
        }
      } catch (err) {
        const saved = localStorage.getItem('total_visits_fallback') || '15240';
        setTotalVisits(parseInt(saved));
      }
    };

    fetchVisits();
    return () => clearInterval(liveInterval);
  }, []);

  const saveToHistory = (result: AnalysisResult, mediaState: MediaState, text: string) => {
    const id = crypto.randomUUID();
    const newItem: HistoryItem = {
      id,
      timestamp: Date.now(),
      result,
      intendedText: text,
      mediaType: mediaState.type,
      submissionLink: result.submissionLink,
      submissionLink2: result.submissionLink2
    };
    const newHistory = [newItem, ...history].slice(0, 10); // Keep last 10
    setHistory(newHistory);
    localStorage.setItem('english_pro_history', JSON.stringify(newHistory));
    setCurrentHistoryId(id);
  };

  const deleteHistoryItem = (id: string) => {
    const newHistory = history.filter(item => item.id !== id);
    setHistory(newHistory);
    localStorage.setItem('english_pro_history', JSON.stringify(newHistory));
    if (currentHistoryId === id) {
      resetApp();
    }
  };

  const selectHistoryItem = (item: HistoryItem) => {
    setAnalysis(item.result);
    setIntendedText(item.intendedText);
    setLink1(item.submissionLink || '');
    setLink2(item.submissionLink2 || '');
    // Note: We cannot restore the actual file objects from history, only the type
    setMedia({ 
      file: null, previewUrl: null, type: item.mediaType,
      file2: null, previewUrl2: null, type2: null 
    });
    setCurrentHistoryId(item.id);
    setView('main');
  };

  const handleAnalysisUpdate = (newResult: AnalysisResult) => {
    setAnalysis(newResult);
    if (currentHistoryId) {
      const updatedHistory = history.map(item => 
        item.id === currentHistoryId 
          ? { ...item, result: newResult }
          : item
      );
      setHistory(updatedHistory);
      localStorage.setItem('english_pro_history', JSON.stringify(updatedHistory));
    }
  };

  const handleFileSelect1 = (file: File) => {
    const type = file.type.startsWith('video') ? 'video' : 'audio';
    const previewUrl = URL.createObjectURL(file);
    setMedia(prev => ({ ...prev, file: file, previewUrl: previewUrl, type: type }));
  };

  const handleFileSelect2 = (file: File) => {
    const type = file.type.startsWith('video') ? 'video' : 'audio';
    const previewUrl = URL.createObjectURL(file);
    setMedia(prev => ({ ...prev, file2: file, previewUrl2: previewUrl, type2: type }));
  };

  const handleStartAnalysis = async () => {
    if (!media.file && !link1) {
      alert("Con ơi, hãy chọn ít nhất 1 video hoặc dán link bài làm nhé! 💜");
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysis(null);
    setCurrentHistoryId(null);

    try {
      const result = await analyzePronunciation(
        media.file, 
        intendedText, 
        undefined, 
        link1,
        media.file2,
        link2
      );
      setAnalysis(result);
      saveToHistory(result, media, intendedText);
    } catch (err) {
      console.error(err);
      setError("Dường như có lỗi nhỏ rồi. Con thử lại nhé! 💜");
    } finally {
      setIsLoading(false);
    }
  };

  const resetApp = () => {
    setMedia({ file: null, previewUrl: null, type: null, file2: null, previewUrl2: null, type2: null });
    setAnalysis(null);
    setError(null);
    setIntendedText('');
    setLink1('');
    setLink2('');
    setCurrentHistoryId(null);
    setView('main');
  };

  return (
    <div className="min-h-screen text-slate-800 pb-20">
      <nav className="pt-8 px-8">
        <div className="container mx-auto max-w-5xl flex justify-between items-center">
          <div className="flex items-center space-x-4 cursor-pointer group" onClick={resetApp}>
            <div className="bg-indigo-600 p-3 rounded-[20px] shadow-xl shadow-indigo-100 group-hover:rotate-6 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <span className="text-2xl font-black tracking-tight text-indigo-900">English<span className="text-indigo-600">Pro</span> 💜</span>
          </div>
          <div className="flex gap-3">
            {view === 'main' ? (
              <button 
                onClick={() => setView('history')}
                className="bg-white text-indigo-600 px-6 py-3 rounded-[20px] font-bold hover:bg-indigo-50 transition-all border border-indigo-100 shadow-sm active:scale-95 flex items-center gap-2"
              >
                <span>📜</span> Lịch sử
              </button>
            ) : (
              <button 
                onClick={() => setView('main')}
                className="bg-indigo-50 text-indigo-600 px-6 py-3 rounded-[20px] font-bold hover:bg-indigo-100 transition-all active:scale-95"
              >
                Trở về
              </button>
            )}
            {(analysis || view === 'history') && (
              <button 
                onClick={resetApp} 
                className="bg-indigo-600 text-white px-8 py-3 rounded-[20px] font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
              >
                Làm lại mới 🔄
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-12 max-w-4xl">
        {view === 'history' ? (
          <HistoryList 
            history={history} 
            onSelectItem={selectHistoryItem} 
            onDeleteItem={deleteHistoryItem}
            onClose={() => setView('main')}
          />
        ) : !analysis && !isLoading ? (
          <div className="space-y-12 animate-in fade-in duration-700">
            <div className="text-center space-y-4">
              <h1 className="text-6xl font-black tracking-tighter text-slate-900 leading-none">
                Luyện Nói <span className="text-indigo-600">Đỉnh Cao</span>
              </h1>
              <p className="text-slate-400 font-bold text-lg">AI sẽ giúp Con sửa từng âm tiết nhỏ nhất ✨</p>
            </div>

            <div className="bg-white p-8 md:p-12 rounded-[48px] shadow-2xl shadow-indigo-100/50 border border-white space-y-10">
              <div className="space-y-4">
                <div className="flex items-center gap-2 pl-1">
                  <span className="text-xl">✍️</span>
                  <label className="block text-xs font-black text-indigo-400 uppercase tracking-[0.2em]">Câu Con muốn luyện tập</label>
                </div>
                <textarea 
                  value={intendedText}
                  onChange={(e) => setIntendedText(e.target.value)}
                  placeholder="Ví dụ: 'I love learning English with Caitlin'..."
                  className="w-full h-40 p-6 rounded-[32px] bg-indigo-50/30 border-2 border-indigo-50 focus:border-indigo-300 focus:ring-0 outline-none transition-all resize-none text-xl font-bold text-indigo-900 placeholder:text-indigo-200"
                />
                <p className="text-[10px] text-slate-300 font-bold text-center px-4">AI sẽ so sánh giọng của Con với câu này để tìm lỗi phát âm.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 pl-1">
                  <span className="text-xl">🎙️</span>
                  <label className="block text-xs font-black text-indigo-400 uppercase tracking-[0.2em]">Nộp bài của Con (Lần 1 & Lần 2)</label>
                </div>
                <FileUpload 
                  onFileSelect1={handleFileSelect1} 
                  onFileSelect2={handleFileSelect2}
                  isLoading={isLoading} 
                  link1={link1}
                  link2={link2}
                  onLink1Change={setLink1}
                  onLink2Change={setLink2}
                  file1Name={media.file?.name}
                  file2Name={media.file2?.name}
                />
                
                <button 
                  onClick={handleStartAnalysis}
                  disabled={isLoading || (!media.file && !link1 && !media.file2 && !link2)}
                  className="w-full bg-indigo-600 text-white text-xl font-black py-4 rounded-[24px] shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none mt-4"
                >
                  {isLoading ? 'Đang chấm bài...' : 'Bắt đầu chấm bài ✨'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            {isLoading ? (
               <div className="flex flex-col items-center justify-center min-h-[45vh] space-y-8">
                  <div className="relative">
                    <div className="w-24 h-24 border-8 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-2xl">🎧</div>
                  </div>
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-black text-indigo-900">Đang lắng nghe Con đây...</h2>
                    <p className="text-slate-400 font-bold italic">AI đang xem Con có phát âm thiếu âm cuối nào không nhé 📝</p>
                  </div>
               </div>
            ) : error ? (
              <div className="bg-white p-12 rounded-[48px] text-center space-y-6 shadow-2xl border border-rose-50 max-w-xl mx-auto">
                <div className="text-6xl animate-bounce">😿</div>
                <h3 className="text-2xl font-black text-slate-800">{error}</h3>
                <button 
                  onClick={resetApp} 
                  className="bg-indigo-600 text-white px-12 py-4 rounded-[24px] font-black text-lg transition-all hover:scale-105"
                >
                  Thử lại nhé Con!
                </button>
              </div>
            ) : (
              <ResultDisplay 
                result={analysis!} 
                media={media} 
                intendedText={intendedText} 
                onUpdateResult={handleAnalysisUpdate}
              />
            )}
          </div>
        )}
      </main>

      <footer className="mt-16 py-12 bg-white/40 backdrop-blur-md border-t border-white/50">
        <div className="container mx-auto px-8 max-w-5xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8 border-b border-indigo-50/50 pb-8">
            <div className="flex flex-col items-center md:items-start space-y-4">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-white px-6 py-2 rounded-full border border-indigo-50">
                   <span className="text-3xl font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-indigo-500 to-purple-600" style={{ fontFamily: "'Dancing Script', cursive, serif" }}>
                     Caitlin
                   </span>
                </div>
              </div>
              <p className="text-xs font-black text-indigo-400 uppercase tracking-widest">Created with Love by Caitlin</p>
            </div>

            <div className="flex gap-6 items-center">
               <div className="bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100 flex items-center gap-2 shadow-sm">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">Online: {liveUsers}</span>
               </div>
               <div className="bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100 flex items-center gap-2 shadow-sm">
                  <span className="text-lg">📊</span>
                  <span className="text-xs font-black text-indigo-700 uppercase tracking-wider">Lượt xem: {totalVisits.toLocaleString()}</span>
               </div>
            </div>

            <div className="flex flex-col items-center md:items-end space-y-4">
              <div className="flex items-center gap-4">
                <a href="https://www.facebook.com/linhyookie" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-2xl border border-blue-100 hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1V12h3l-.5 3H13v6.8c4.56-.93 8-4.96 8-9.8z"/></svg>
                  <span className="text-sm font-bold">Linh Yookie</span>
                </a>
                <div className="flex items-center gap-2 bg-sky-50 text-sky-600 px-4 py-2 rounded-2xl border border-sky-100 shadow-sm">
                   <span className="text-xs font-black uppercase">Zalo:</span>
                   <span className="text-sm font-bold">0862936906</span>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center">
             <p className="text-[10px] text-slate-400 font-medium">© 2024 EnglishPro. Dành tặng cho các Con yêu thích Tiếng Anh.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;