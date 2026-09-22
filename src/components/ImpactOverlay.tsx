import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { ThrowItem, ObjectType } from '../types';
import { sounds } from '../utils/audio';
import { X, Send, Heart, Flame, Gift, Sparkles, PartyPopper } from 'lucide-react';

interface ImpactOverlayProps {
  throwItem: ThrowItem;
  onClose: () => void;
  onReply?: (recipientId: string, replyType: ObjectType) => void;
}

export const ImpactOverlay: React.FC<ImpactOverlayProps> = ({ throwItem, onClose, onReply }) => {
  const [stage, setStage] = useState<'landing' | 'impact' | 'revealed'>('landing');

  useEffect(() => {
    // 1. Landing sequence
    const landingTimer = setTimeout(() => {
      setStage('impact');

      if (throwItem.objectType === 'grenade') {
        sounds.playExplosion();
      } else if (throwItem.objectType === 'letter') {
        sounds.playLetterOpen();
      } else if (throwItem.objectType === 'heart') {
        sounds.playHeartChime();
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FF4B72', '#EF4444', '#F43F5E', '#fda4af']
        });
      } else if (throwItem.objectType === 'gift') {
        sounds.playGiftOpen();
        confetti({
          particleCount: 65,
          spread: 80,
          origin: { y: 0.55 },
          colors: ['#F59E0B', '#FBBF24', '#EC4899', '#8B5CF6', '#FDE047']
        });
      } else if (throwItem.objectType === 'popper') {
        sounds.playPartyPopper();
        // Dual directional streamer bursts
        confetti({
          particleCount: 75,
          angle: 60,
          spread: 60,
          origin: { x: 0.15, y: 0.75 },
          colors: ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#3B82F6']
        });
        confetti({
          particleCount: 75,
          angle: 120,
          spread: 60,
          origin: { x: 0.85, y: 0.75 },
          colors: ['#EC4899', '#F59E0B', '#10B981', '#6366F1', '#3B82F6']
        });
      } else if (throwItem.objectType === 'confetti_bomb') {
        sounds.playConfettiBomb();
        // Giant 360-degree rainbow confetti storm
        confetti({
          particleCount: 160,
          spread: 360,
          startVelocity: 45,
          origin: { x: 0.5, y: 0.5 },
          colors: ['#FF007A', '#00F0FF', '#FFE600', '#7000FF', '#00FF66', '#FF5E00']
        });
      } else {
        sounds.playSnap();
      }
    }, 550);

    // 2. Reveal content
    const revealDelay =
      throwItem.objectType === 'grenade' ? 1400 : throwItem.objectType === 'gift' ? 1300 : 950;

    const revealTimer = setTimeout(() => {
      setStage('revealed');
    }, revealDelay);

    return () => {
      clearTimeout(landingTimer);
      clearTimeout(revealTimer);
    };
  }, [throwItem]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center select-none overflow-hidden ${
        stage === 'impact' &&
        (throwItem.objectType === 'grenade' || throwItem.objectType === 'confetti_bomb')
          ? 'animate-screen-shake'
          : ''
      }`}
    >
      {/* 1. Backdrop Glass Dimmer */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-500"
        onClick={stage === 'revealed' ? onClose : undefined}
      />

      {/* 2. GRENADE FULL-SCREEN BLAST & BURNT PAPER SCREEN EDGES */}
      {throwItem.objectType === 'grenade' && stage === 'impact' && (
        <>
          <div className="absolute inset-0 bg-white z-50 animate-flash pointer-events-none" />
          <div className="absolute w-[600px] h-[600px] rounded-full border-8 border-amber-400/80 animate-shockwave pointer-events-none" />
          <div className="absolute w-[700px] h-[700px] rounded-full border-4 border-orange-500/50 animate-shockwave-delayed pointer-events-none" />
          <div className="absolute inset-0 pointer-events-none border-[24px] sm:border-[36px] border-orange-600/80 shadow-[inset_0_0_80px_rgba(239,68,68,0.9),inset_0_0_120px_rgba(0,0,0,0.8)] animate-pulse" />
        </>
      )}

      {/* Residual Burnt Edges during reveal for Grenade */}
      {throwItem.objectType === 'grenade' && stage === 'revealed' && (
        <div className="absolute inset-0 pointer-events-none border-[12px] sm:border-[20px] border-amber-950/60 shadow-[inset_0_0_50px_rgba(180,83,9,0.5),inset_0_0_80px_rgba(0,0,0,0.6)]" />
      )}

      {/* 3. CONFETTI BOMB RAINBOW SHOCKWAVE */}
      {throwItem.objectType === 'confetti_bomb' && stage === 'impact' && (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-cyan-500/20 animate-flash pointer-events-none" />
          <div className="absolute w-[650px] h-[650px] rounded-full border-8 border-pink-400/80 animate-shockwave pointer-events-none" />
          <div className="absolute w-[750px] h-[750px] rounded-full border-4 border-cyan-400/60 animate-shockwave-delayed pointer-events-none" />
        </>
      )}

      {/* 4. GIFT BOX UNTYING ANIMATION DURING IMPACT */}
      {throwItem.objectType === 'gift' && stage === 'impact' && (
        <div className="relative z-50 flex flex-col items-center justify-center animate-scale-up pointer-events-none">
          <div className="w-36 h-36 relative flex items-center justify-center">
            {/* Box Lid Lifting & Untying Ribbon */}
            <div className="text-8xl animate-bounce">🎁</div>
            <Sparkles className="absolute -top-4 -right-4 w-10 h-10 text-amber-300 animate-spin" />
            <Sparkles className="absolute -bottom-2 -left-4 w-8 h-8 text-rose-300 animate-ping" />
          </div>
          <p className="mt-3 text-sm font-bold text-white tracking-widest uppercase drop-shadow-md">
            Untying ribbon...
          </p>
        </div>
      )}

      {/* 5. PARTY POPPER DIGITAL BURST DURING IMPACT */}
      {throwItem.objectType === 'popper' && stage === 'impact' && (
        <div className="relative z-50 flex flex-col items-center justify-center animate-scale-up pointer-events-none">
          <div className="text-8xl animate-bounce">🎉</div>
          <p className="mt-3 text-lg font-black text-amber-300 tracking-wider drop-shadow-lg animate-pulse">
            POP!
          </p>
        </div>
      )}

      {/* 6. REVEALED CONTENT MODALS */}
      {stage === 'revealed' && (
        <div className="relative z-50 w-full max-w-sm sm:max-w-md mx-4 animate-scale-up">
          {throwItem.objectType === 'letter' ? (
            /* Handwritten Letter Card (matching Video 1) */
            <div className="relative bg-[#FAFAF9] rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-stone-200/90 text-stone-800">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
                <div className="flex items-center gap-2">
                  <img
                    src={throwItem.senderAvatar}
                    alt={throwItem.senderName}
                    className="w-7 h-7 rounded-full object-cover ring-2 ring-indigo-500/40"
                  />
                  <div>
                    <span className="text-xs font-bold text-stone-900 block leading-tight">
                      {throwItem.senderName}
                    </span>
                    <span className="text-[10px] text-stone-500 block">
                      {throwItem.senderCity} • {throwItem.distanceMiles} mi away
                    </span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="min-h-[160px] sm:min-h-[190px] py-1">
                <p
                  className="text-stone-900 text-2xl sm:text-[25px] leading-[1.5] font-['Caveat',_cursive] whitespace-pre-line selection:bg-indigo-100"
                  style={{
                    backgroundImage: 'linear-gradient(transparent 33px, rgba(214, 211, 209, 0.4) 34px)',
                    backgroundSize: '100% 34px',
                    lineHeight: '34px'
                  }}
                >
                  {throwItem.content ||
                    `thank you so much !!\nthis means the world to me.\ngetting your letter brought such a warm smile to my face.\nwith all my love,\n${throwItem.senderName}.`}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-stone-200 mt-4">
                <span className="text-[11px] font-medium text-stone-400">
                  Delivered via 3D flight
                </span>
                <div className="flex items-center gap-2">
                  {onReply && (
                    <button
                      onClick={() => onReply(throwItem.senderId, 'letter')}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-semibold shadow-md active:scale-95 transition-all"
                    >
                      <Send size={13} />
                      <span>Reply</span>
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="px-3.5 py-2 rounded-full bg-stone-200/80 hover:bg-stone-300 text-stone-700 text-xs font-semibold transition-all active:scale-95"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          ) : throwItem.objectType === 'grenade' ? (
            /* Charred Prank Grenade Blast Card */
            <div className="relative bg-stone-950/95 text-stone-100 rounded-3xl p-6 sm:p-7 shadow-[0_25px_60px_rgba(239,68,68,0.25)] border-2 border-orange-500/60 overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-orange-600/30 flex items-center justify-center text-orange-400">
                    <Flame size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-orange-400 tracking-wide">
                      DIRECT HIT FROM {throwItem.senderName.toUpperCase()}!
                    </h3>
                    <p className="text-[10px] text-stone-400">
                      {throwItem.senderCity} • Exploded on your screen!
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 rounded-full text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="py-4 text-center">
                <div className="text-6xl mb-3 animate-bounce select-none">💣💥</div>
                <p className="text-lg sm:text-xl font-bold text-amber-200 leading-snug">
                  "{throwItem.content || 'BOOM! No safe zones between friends. You owe me lunch now!'}"
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-800 mt-2">
                {onReply && (
                  <button
                    onClick={() => onReply(throwItem.senderId, 'grenade')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white text-xs font-bold shadow-lg shadow-red-900/40 active:scale-95 transition-all"
                  >
                    <span>Throw Grenade Back 💣</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition-all active:scale-95"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ) : throwItem.objectType === 'gift' ? (
            /* GIFT BOX UNWRAPPED REVEAL */
            <div className="relative bg-gradient-to-b from-rose-50 to-white rounded-3xl p-6 sm:p-7 shadow-[0_25px_60px_rgba(244,63,94,0.3)] border-2 border-rose-200 text-stone-800 text-center">
              <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shadow-inner">
                <Gift size={32} className="animate-bounce" />
              </div>
              <span className="text-[11px] font-bold text-rose-600 uppercase tracking-widest">
                Special Surprise Unwrapped
              </span>
              <h3 className="text-xl font-extrabold text-stone-900 mt-1">
                Gift Box from {throwItem.senderName}
              </h3>
              <p className="text-xs text-stone-500 mb-3">{throwItem.senderCity}</p>
              <div className="bg-white/80 rounded-2xl p-4 border border-rose-100 shadow-xs mb-5">
                <p className="text-stone-800 text-lg font-['Caveat',_cursive] leading-relaxed">
                  "{throwItem.content || 'Wrapped with love and good thoughts for you today! Enjoy this special gift! ✨'}"
                </p>
              </div>
              <div className="flex items-center justify-center gap-2">
                {onReply && (
                  <button
                    onClick={() => onReply(throwItem.senderId, 'gift')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md active:scale-95 transition-all"
                  >
                    <Gift size={14} />
                    <span>Send Gift Back</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold active:scale-95 transition-all"
                >
                  Thanks!
                </button>
              </div>
            </div>
          ) : throwItem.objectType === 'popper' ? (
            /* PARTY POPPER CELEBRATION REVEAL */
            <div className="relative bg-gradient-to-b from-amber-50 via-white to-indigo-50 rounded-3xl p-6 sm:p-7 shadow-[0_25px_60px_rgba(99,102,241,0.25)] border-2 border-indigo-200 text-stone-800 text-center">
              <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shadow-inner">
                <PartyPopper size={32} className="animate-spin" />
              </div>
              <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest">
                Confetti Popped!
              </span>
              <h3 className="text-xl font-extrabold text-stone-900 mt-1">
                Celebration from {throwItem.senderName}
              </h3>
              <p className="text-xs text-stone-500 mb-3">{throwItem.senderCity}</p>
              <div className="bg-white/90 rounded-2xl p-4 border border-indigo-100 shadow-xs mb-5">
                <p className="text-stone-800 text-lg font-bold">
                  "{throwItem.content || 'Woohoo!! 🎉 Cheering for you from across the world! Let us celebrate!'}"
                </p>
              </div>
              <div className="flex items-center justify-center gap-2">
                {onReply && (
                  <button
                    onClick={() => onReply(throwItem.senderId, 'popper')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md active:scale-95 transition-all"
                  >
                    <span>Pop One Back 🎉</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold active:scale-95 transition-all"
                >
                  Cheers!
                </button>
              </div>
            </div>
          ) : throwItem.objectType === 'confetti_bomb' ? (
            /* CONFETTI BOMB REVEAL */
            <div className="relative bg-slate-950 text-white rounded-3xl p-6 sm:p-7 shadow-[0_25px_60px_rgba(236,72,153,0.35)] border-2 border-pink-500 text-center overflow-hidden">
              <div className="text-6xl mb-2 animate-bounce">🎊✨</div>
              <span className="text-[11px] font-extrabold text-pink-400 uppercase tracking-widest">
                Rainbow Storm Direct Hit!
              </span>
              <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-300 to-cyan-300 mt-1">
                Confetti Bomb Exploded!
              </h3>
              <p className="text-xs text-slate-400 mb-3">
                Thrown by {throwItem.senderName} from {throwItem.senderCity}
              </p>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 mb-5">
                <p className="text-amber-200 text-lg font-bold">
                  "{throwItem.content || 'KABOOM!! You just got blasted with 10,000 pieces of joy! 🎊'}"
                </p>
              </div>
              <div className="flex items-center justify-center gap-2">
                {onReply && (
                  <button
                    onClick={() => onReply(throwItem.senderId, 'confetti_bomb')}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white text-xs font-bold shadow-lg active:scale-95 transition-all"
                  >
                    <span>Bomb Them Back 🎊</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-semibold active:scale-95 transition-all"
                >
                  Awesome!
                </button>
              </div>
            </div>
          ) : (
            /* Heart / Love Card */
            <div className="relative bg-white/95 rounded-3xl p-6 sm:p-7 shadow-[0_25px_60px_rgba(244,63,94,0.25)] border border-pink-100 text-stone-800 text-center">
              <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 shadow-inner">
                <Heart size={32} className="fill-rose-500 animate-pulse" />
              </div>
              <h3 className="text-base font-bold text-stone-900">
                Warm Love from {throwItem.senderName}
              </h3>
              <p className="text-xs text-stone-500 mb-3">{throwItem.senderCity}</p>
              <p className="text-stone-700 text-lg font-['Caveat',_cursive] mb-5">
                "{throwItem.content || 'Sending you warm hugs and smiles today!'}"
              </p>
              <div className="flex items-center justify-center gap-2">
                {onReply && (
                  <button
                    onClick={() => onReply(throwItem.senderId, 'heart')}
                    className="px-4 py-2 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold shadow-md active:scale-95 transition-all"
                  >
                    Send Love Back ❤️
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold active:scale-95 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
