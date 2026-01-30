import React, { useRef } from 'react';

interface FileUploadProps {
  onFileSelect1: (file: File) => void;
  onFileSelect2: (file: File) => void;
  isLoading: boolean;
  link1: string;
  link2: string;
  onLink1Change: (link: string) => void;
  onLink2Change: (link: string) => void;
  file1Name?: string | null;
  file2Name?: string | null;
}

export const FileUpload: React.FC<FileUploadProps> = ({ 
  onFileSelect1, 
  onFileSelect2, 
  isLoading, 
  link1, 
  link2, 
  onLink1Change, 
  onLink2Change,
  file1Name,
  file2Name
}) => {
  const inputRef1 = useRef<HTMLInputElement>(null);
  const inputRef2 = useRef<HTMLInputElement>(null);

  const handleFileChange1 = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) onFileSelect1(e.target.files[0]);
  };

  const handleFileChange2 = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) onFileSelect2(e.target.files[0]);
  };

  const renderUploadBox = (
    label: string, 
    linkValue: string, 
    onLinkChange: (val: string) => void, 
    inputRef: React.RefObject<HTMLInputElement | null>,
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    fileName?: string | null
  ) => (
    <div className="flex-1 space-y-3 min-w-[300px]">
      <div className="flex items-center gap-2 mb-1">
        <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">{label}</span>
      </div>
      
      {/* Link Input */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-lg opacity-50 group-focus-within:opacity-100 transition-opacity">🔗</span>
        </div>
        <input
          type="text"
          value={linkValue}
          onChange={(e) => onLinkChange(e.target.value)}
          placeholder={`Link Facebook ${label}...`}
          disabled={isLoading}
          className="w-full pl-9 pr-4 py-3 rounded-2xl border-2 border-indigo-50 bg-white text-indigo-900 placeholder:text-indigo-200 focus:border-indigo-300 focus:ring-0 outline-none font-bold transition-all text-xs"
        />
      </div>

      {/* File Upload Option */}
      <div 
        className={`relative border-2 border-dashed rounded-[24px] p-6 transition-all flex flex-col items-center justify-center space-y-2 cursor-pointer group h-40
          ${isLoading ? 'border-indigo-100 bg-slate-50' : 
            fileName ? 'border-emerald-200 bg-emerald-50/30' : 'border-indigo-200 bg-indigo-50/20 hover:border-indigo-400 hover:bg-indigo-50/40'}`}
        onClick={() => !isLoading && inputRef.current?.click()}
      >
        <input type="file" ref={inputRef} onChange={onFileChange} accept="audio/*,video/*" className="hidden" disabled={isLoading} />
        
        {fileName ? (
          <>
            <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xl shadow-lg shadow-emerald-200">
              ✓
            </div>
            <p className="font-bold text-emerald-700 text-xs text-center break-all px-2 line-clamp-2">{fileName}</p>
            <p className="text-[9px] text-emerald-500 uppercase font-black tracking-widest">Đã chọn</p>
          </>
        ) : (
          <>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl transition-all ${isLoading ? 'bg-slate-200' : 'bg-indigo-600 text-white group-hover:scale-110 shadow-lg shadow-indigo-200'}`}>
              {isLoading ? '⏳' : '📥'}
            </div>
            <div className="text-center">
              <p className="font-bold text-indigo-900 text-xs">Tải file {label}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full flex flex-col md:flex-row gap-4">
      {renderUploadBox("Lần 1", link1, onLink1Change, inputRef1, handleFileChange1, file1Name)}
      {renderUploadBox("Lần 2 (Tùy chọn)", link2, onLink2Change, inputRef2, handleFileChange2, file2Name)}
    </div>
  );
};