
import React, { useRef, useState } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isLoading }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([blob], 'recording.webm', { type: 'audio/webm' });
        onFileSelect(file);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Lỗi truy cập microphone:", err);
      alert("Không thể truy cập Microphone. Vui lòng cấp quyền để ghi âm nhé! 🎙️");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* File Upload Option */}
      <div 
        className={`relative border-2 border-dashed rounded-[32px] p-6 transition-all flex flex-col items-center justify-center space-y-3 cursor-pointer group
          ${isLoading ? 'border-indigo-100 bg-slate-50' : 'border-indigo-200 bg-indigo-50/20 hover:border-indigo-400 hover:bg-indigo-50/40'}`}
        onClick={() => !isLoading && !isRecording && inputRef.current?.click()}
      >
        <input type="file" ref={inputRef} onChange={handleFileChange} accept="audio/*,video/*" className="hidden" disabled={isLoading || isRecording} />
        
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all ${isLoading ? 'bg-slate-200' : 'bg-indigo-600 text-white group-hover:scale-110'}`}>
          {isLoading ? '⏳' : '📥'}
        </div>

        <div className="text-center">
          <p className="font-bold text-indigo-900 text-sm">Tải tệp lên</p>
          <p className="text-[10px] text-indigo-400 mt-1 uppercase font-black tracking-widest">MP3, MP4, MOV</p>
        </div>
      </div>

      {/* Live Record Option */}
      <div 
        className={`relative border-2 border-dashed rounded-[32px] p-6 transition-all flex flex-col items-center justify-center space-y-3 cursor-pointer group
          ${isRecording ? 'border-rose-400 bg-rose-50' : 'border-purple-200 bg-purple-50/20 hover:border-purple-400 hover:bg-purple-50/40'}`}
        onClick={() => !isLoading && (isRecording ? stopRecording() : startRecording())}
      >
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all 
          ${isRecording ? 'bg-rose-500 text-white animate-pulse' : 'bg-purple-600 text-white group-hover:scale-110'}`}>
          {isRecording ? '⏹️' : '🎙️'}
        </div>

        <div className="text-center">
          <p className={`font-bold text-sm ${isRecording ? 'text-rose-600' : 'text-purple-900'}`}>
            {isRecording ? `Đang ghi âm... ${formatTime(recordingTime)}` : 'Ghi âm trực tiếp'}
          </p>
          <p className="text-[10px] text-purple-400 mt-1 uppercase font-black tracking-widest">
            {isRecording ? 'Nhấn để dừng' : 'Yêu cầu quyền Mic'}
          </p>
        </div>
      </div>
    </div>
  );
};
