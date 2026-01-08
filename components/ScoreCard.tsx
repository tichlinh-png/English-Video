
import React from 'react';

interface ScoreCardProps {
  label: string;
  score: number;
  color: string;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({ label, score, color }) => {
  return (
    <div className="bg-white p-6 rounded-[24px] shadow-sm border border-indigo-50 flex flex-col items-center">
      <div className="relative flex items-center justify-center">
        <svg className="w-16 h-16">
          <circle className="text-slate-100" strokeWidth="6" stroke="currentColor" fill="transparent" r="26" cx="32" cy="32" />
          <circle
            style={{ strokeDasharray: 163.3, strokeDashoffset: 163.3 - (163.3 * score) / 100 }}
            className={color}
            strokeWidth="6"
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r="26"
            cx="32"
            cy="32"
          />
        </svg>
        <span className="absolute text-sm font-bold text-slate-800">{score}</span>
      </div>
      <span className="mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
    </div>
  );
};
