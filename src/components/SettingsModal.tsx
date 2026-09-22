import React from 'react';
import { UserProfile } from '../types';
import { sounds } from '../utils/audio';
import { X, Volume2, VolumeX, UserCheck, ShieldCheck, LogIn, LogOut, Sparkles } from 'lucide-react';
import { signInWithPopup, signOut, User } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  availableProfiles: UserProfile[];
  onSwitchProfile: (profile: UserProfile) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isFastTravel: boolean;
  onToggleFastTravel: () => void;
  authUser: User | null;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  availableProfiles,
  onSwitchProfile,
  isMuted,
  onToggleMute,
  isFastTravel,
  onToggleFastTravel,
  authUser
}) => {
  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.warn('Google sign in error:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Sign out error:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 backdrop-blur-md select-none">
      <div className="relative w-full max-w-sm bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/80 p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Settings</h2>
          </div>
          <button
            onClick={() => {
              sounds.playSnap();
              onClose();
            }}
            className="p-1 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Profile Simulation / Switcher */}
        <div className="mt-4">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
            Active User (Test Cross-Device View)
          </label>
          <div className="space-y-1.5 max-h-44 overflow-y-auto no-scrollbar pr-1">
            {availableProfiles.map((p) => {
              const isActive = p.id === currentUser.id;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    sounds.playSnap();
                    onSwitchProfile(p);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-xl transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <img src={p.avatar} alt={p.name} className="w-8 h-8 rounded-full object-cover" />
                    <div className="text-left">
                      <p className="text-xs font-bold leading-tight">{p.name}</p>
                      <p className={`text-[10px] ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>
                        {p.city}
                      </p>
                    </div>
                  </div>
                  {isActive && <UserCheck size={16} className="text-emerald-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sound Toggle */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-800">Sound Effects & Haptics</p>
            <p className="text-[11px] text-slate-400">Wind whoosh, explosions, chimes</p>
          </div>
          <button
            onClick={onToggleMute}
            className={`p-2.5 rounded-full transition-colors ${
              isMuted ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 text-indigo-600'
            }`}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>

        {/* DEV MODE (FAST TRAVEL) TOGGLE */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-800">Dev Mode (Fast Travel)</span>
              <span className="px-1.5 py-0.2 text-[9px] font-bold bg-amber-100 text-amber-800 rounded uppercase">
                Testing
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Divides delay by 10,000 to test couriers in seconds vs days
            </p>
          </div>
          <button
            onClick={onToggleFastTravel}
            role="switch"
            aria-checked={isFastTravel}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              isFastTravel ? 'bg-amber-500' : 'bg-slate-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                isFastTravel ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Firebase Authentication */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-indigo-600" />
                <span>Firebase Cloud Sync</span>
              </p>
              <p className="text-[10px] text-slate-400">
                {authUser ? `Signed in as ${authUser.displayName || authUser.email}` : 'Firestore database connected'}
              </p>
            </div>
            {authUser ? (
              <button
                onClick={handleSignOut}
                className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1 transition-all"
              >
                <LogOut size={13} />
                <span>Sign Out</span>
              </button>
            ) : (
              <button
                onClick={handleGoogleSignIn}
                className="px-3 py-1.5 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
              >
                <LogIn size={13} />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-5 text-center">
          <p className="text-[11px] text-slate-400">
            Throw • Spatial messaging on 3D Globe
          </p>
        </div>
      </div>
    </div>
  );
};
