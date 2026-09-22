import React, { useState, useEffect } from 'react';
import { Send, Mic, Sparkles, X, Volume2 } from 'lucide-react';
import { UserProfile } from '../types';
import { sounds } from '../utils/audio';

interface LetterComposerProps {
  recipient: UserProfile;
  initialMessage?: string;
  onSend: (message: string, isAudioNote?: boolean) => void;
  onClose: () => void;
  isSending?: boolean;
}

export const LetterComposer: React.FC<LetterComposerProps> = ({
  recipient,
  initialMessage = '',
  onSend,
  onClose,
  isSending = false
}) => {
  const [message, setMessage] = useState(
    initialMessage ||
      `happy birthday !!\nto my favorite person,\nthe one who always makes\nmy heart feel safe and happy.\ni'm beyond grateful to have you\nin my life. i love you.`
  );
  const [isRecording, setIsRecording] = useState(false);
  const [audioWaves, setAudioWaves] = useState<number[]>([4, 12, 24, 16, 28, 8, 18, 10]);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Equalizer animation when voice memo is active
  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => {
      setAudioWaves(
        Array.from({ length: 8 }, () => Math.floor(Math.random() * 26) + 4)
      );
    }, 120);
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleSend = () => {
    if (!message.trim() && !isRecording) return;
    sounds.playWhoosh();
    onSend(message, isRecording);
  };

  const handleToggleVoice = () => {
    sounds.playSnap();
    if (!isRecording) {
      setIsRecording(true);
      if (!message.trim()) {
        setMessage('🎙️ [Voice Memo: 0:14] "Hey, just thinking of you across the miles..."');
      }
    } else {
      setIsRecording(false);
    }
  };

  // AI-assisted note generation for personalized letter drafting
  const handleAiInspire = async () => {
    sounds.playSnap();
    setIsGeneratingAi(true);
    try {
      const response = await fetch('/api/suggest-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientName: recipient.name,
          recipientCity: recipient.city,
          topic: 'heartfelt'
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.note) {
          setMessage(data.note);
          sounds.playLetterOpen();
          setIsGeneratingAi(false);
          return;
        }
      }
    } catch {
      // Fallback local prompts tailored to friend & city
    }

    // High quality personalized fallback
    const fallbacks = [
      `thinking of you in ${recipient.city} ✨\nwishing I could just drop by and grab coffee with you today.\nsending you all the warmest thoughts and love across the miles!`,
      `hey ${recipient.name}!\njust wanted to remind you how much you mean to me.\nthank you for always being in my corner. see you soon ❤️`,
      `to my dearest ${recipient.name},\nno matter how many miles separate us, you're always right here in my heart.\nhappy moments to you today!`
    ];
    setMessage(fallbacks[Math.floor(Math.random() * fallbacks.length)]);
    sounds.playLetterOpen();
    setIsGeneratingAi(false);
  };

  return (
    <div className="relative w-full max-w-sm sm:max-w-md mx-auto z-30 px-4">
      {/* Frosted Glass Stationery Card */}
      <div className="relative bg-white/90 backdrop-blur-2xl rounded-3xl p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.18)] border border-white/80 transition-all">
        {/* Top Header inside card */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100/80 mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Letter for {recipient.name}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Ruled / Handwriting Area */}
        <div className="relative min-h-[160px] sm:min-h-[190px]">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="write something for your loved one..."
            rows={6}
            disabled={isSending}
            className="w-full bg-transparent resize-none border-none outline-none text-[#1E3A8A] text-2xl sm:text-[26px] leading-[1.4] font-['Caveat',_cursive] placeholder:text-slate-400 placeholder:font-['Caveat',_cursive] selection:bg-indigo-100"
            style={{
              backgroundImage: 'linear-gradient(transparent 34px, rgba(226, 232, 240, 0.6) 35px)',
              backgroundSize: '100% 36px',
              lineHeight: '36px'
            }}
          />
        </div>

        {/* Audio Visualizer Bar if Recording */}
        {isRecording && (
          <div className="flex items-center justify-center gap-1.5 py-2 my-1 bg-indigo-50/70 rounded-xl px-3 border border-indigo-100/50">
            <Volume2 size={16} className="text-indigo-600 animate-pulse mr-1" />
            <span className="text-xs font-medium text-indigo-700 mr-2">Recording Memo</span>
            <div className="flex items-center gap-1 h-6">
              {audioWaves.map((height, i) => (
                <div
                  key={i}
                  className="w-1 bg-indigo-600 rounded-full transition-all duration-100"
                  style={{ height: `${height}px` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Bottom Actions Bar */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100/80 mt-2">
          {/* Left tools: AI generator & Voice memo */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleAiInspire}
              disabled={isGeneratingAi || isSending}
              title="AI Note Inspire"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-indigo-700 bg-indigo-50/90 hover:bg-indigo-100/80 border border-indigo-200/50 transition-all active:scale-95 shadow-xs"
            >
              <Sparkles size={14} className={isGeneratingAi ? 'animate-spin' : ''} />
              <span>{isGeneratingAi ? 'Inspiring...' : 'Inspire'}</span>
            </button>

            <button
              onClick={handleToggleVoice}
              disabled={isSending}
              title={isRecording ? 'Stop Recording' : 'Record Voice Memo'}
              className={`p-2 rounded-full transition-all active:scale-90 ${
                isRecording
                  ? 'bg-rose-500 text-white shadow-md animate-pulse'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80'
              }`}
            >
              <Mic size={17} />
            </button>
          </div>

          {/* Right tool: Send Button */}
          <button
            onClick={handleSend}
            disabled={isSending || (!message.trim() && !isRecording)}
            className="flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-slate-900 hover:bg-black text-white text-sm font-semibold shadow-lg shadow-black/15 transition-all active:scale-95 disabled:opacity-50"
          >
            <Send size={15} />
            <span>Throw</span>
          </button>
        </div>
      </div>
    </div>
  );
};
