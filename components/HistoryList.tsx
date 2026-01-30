
import React from 'react';
import { HistoryItem } from '../types';

interface HistoryListProps {
  history: HistoryItem[];
  onSelectItem: (item: HistoryItem) => void;
  onDeleteItem: (id: string) => void;
  onClose: () => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({ history, onSelectItem, onDeleteItem, onClose }) => {
  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(timestamp));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center px-2">
        <div>
          <h2 className="text-2xl font-black text-indigo-900">Nhật ký của Con 📚</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Nơi lưu giữ sự tiến bộ mỗi ngày</p>
        </div>
        <button 
          onClick={onClose}
          className="bg-white text-slate-400 p-3 rounded-2xl border border-slate-100 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {history.length === 0 ? (
        <div className="bg-white p-16 rounded-[48px] text-center border-2 border-dashed border-indigo-50">
          <span className="text-6xl block mb-4">🌱</span>
          <p className="text-slate-400 font-bold">Con chưa có bài học nào được lưu lại.<br/>Bắt đầu bài luyện tập đầu tiên nhé!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {history.map((item) => (
            <div 
              key={item.id} 
              className="group bg-white p-6 rounded-[32px] border border-indigo-50 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer relative overflow-hidden"
              onClick={() => onSelectItem(item)}
            >
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{formatDate(item.timestamp)}</span>
                  <h4 className="font-bold text-slate-800 line-clamp-1 pr-8">
                    {item.intendedText || item.result.transcript || "Bài luyện tập không tên"}
                  </h4>
                </div>
                <div className="flex flex-col items-end gap-2">
                   <div className="bg-indigo-600 text-white w-10 h-10 rounded-xl flex items-center justify-center font-black shadow-sm">
                    {item.result.scores.overall}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider relative z-10">
                <span className="px-3 py-1 bg-slate-50 rounded-full text-slate-500">
                  {item.mediaType === 'video' ? '🎬 Video' : '🎙️ Audio'}
                </span>
                <span className="text-rose-400">
                   Acc: {item.result.scores.accuracy}%
                </span>
                <span className="text-sky-400">
                   Flu: {item.result.scores.fluency}%
                </span>
              </div>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteItem(item.id);
                }}
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-rose-500 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>

              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-indigo-50/20 rounded-full group-hover:scale-110 transition-transform"></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
