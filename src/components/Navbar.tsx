import React from 'react';
import { FileUp, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  activeTab: 'dashboard' | 'verification' | 'exceptions' | 'architecture';
  setActiveTab: (tab: 'dashboard' | 'verification' | 'exceptions' | 'architecture') => void;
  exceptionCount: number;
  onOpenUpload: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  exceptionCount,
  onOpenUpload,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0B0F17]/90 backdrop-blur-md border-b border-slate-800/80 px-6 py-3.5 flex items-center justify-between gap-8">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('dashboard');
          }}
          className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2"
        >
          <span className="w-2.5 h-2.5 bg-blue-500 rounded-sm inline-block"></span>
          DocuFlow AP
        </a>
        <span className="text-xs text-slate-500 hidden sm:inline">
          Autonomous AP Pipeline
        </span>
      </div>

      {/* Zone 2: 4 concise single-line navigation links */}
      <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-400">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'dashboard'
              ? 'text-white font-semibold'
              : 'hover:text-slate-200'
          }`}
        >
          Overview & Queue
        </button>
        <button
          onClick={() => setActiveTab('verification')}
          className={`transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'verification'
              ? 'text-white font-semibold'
              : 'hover:text-slate-200'
          }`}
        >
          Verification Studio
        </button>
        <button
          onClick={() => setActiveTab('exceptions')}
          className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
            activeTab === 'exceptions'
              ? 'text-white font-semibold'
              : 'hover:text-slate-200'
          }`}
        >
          Exception Center
          {exceptionCount > 0 && (
            <span className="text-xs text-amber-400 font-mono font-medium">
              ({exceptionCount})
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('architecture')}
          className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
            activeTab === 'architecture'
              ? 'text-white font-semibold'
              : 'hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Pipeline Architecture
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenUpload}
          className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 active:bg-blue-700 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 shadow-sm"
        >
          <FileUp className="w-3.5 h-3.5" />
          Process Document
        </button>
      </div>
    </header>
  );
};
