import React from 'react';
import { ObjectType } from '../types';

interface VirtualObjectProps {
  type: ObjectType;
  className?: string;
  size?: number;
}

export const VirtualObject: React.FC<VirtualObjectProps> = ({ type, className = '', size = 160 }) => {
  if (type === 'letter') {
    // Elegant origami paper plane with realistic geometric facets & lighting
    return (
      <div
        className={`relative flex items-center justify-center transition-transform ${className}`}
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full drop-shadow-2xl"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle under-shadow */}
          <ellipse cx="100" cy="180" rx="70" ry="14" fill="rgba(0,0,0,0.12)" filter="blur(8px)" />

          {/* Left Wing Outer */}
          <polygon
            points="100,20 18,172 100,140"
            fill="#FFFFFF"
            stroke="#E2E8F0"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Right Wing Outer */}
          <polygon
            points="100,20 182,172 100,140"
            fill="#F8FAFC"
            stroke="#CBD5E1"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Left Wing Crease / Inner Fold */}
          <polygon
            points="100,20 54,160 100,140"
            fill="#EDF2F7"
            stroke="#CBD5E1"
            strokeWidth="1"
            strokeLinejoin="round"
          />
          {/* Right Wing Crease / Inner Fold */}
          <polygon
            points="100,20 146,160 100,140"
            fill="#E2E8F0"
            stroke="#CBD5E1"
            strokeWidth="1"
            strokeLinejoin="round"
          />
          {/* Center Keel Spine */}
          <polygon
            points="100,20 96,165 100,140"
            fill="#CBD5E1"
          />
          <polygon
            points="100,20 104,165 100,140"
            fill="#94A3B8"
          />
          {/* Center Line Highlight */}
          <line
            x1="100"
            y1="20"
            x2="100"
            y2="165"
            stroke="#64748B"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  if (type === 'grenade') {
    // Tactical segmented pineapple grenade with pin and metallic sheen
    return (
      <div
        className={`relative flex items-center justify-center transition-transform ${className}`}
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 200 240"
          className="w-full h-full drop-shadow-2xl"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Ground shadow */}
          <ellipse cx="100" cy="225" rx="55" ry="12" fill="rgba(0,0,0,0.18)" filter="blur(6px)" />

          {/* Fuze Head / Top Cap */}
          <rect x="88" y="44" width="24" height="20" rx="3" fill="#64748B" stroke="#334155" strokeWidth="2" />
          
          {/* Safety Lever Handle */}
          <path
            d="M92 48 C 65 42, 54 80, 56 120 C 57 145, 60 160, 62 170"
            stroke="#475569"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />

          {/* Pull Ring & Safety Pin */}
          <circle cx="132" cy="56" r="14" stroke="#94A3B8" strokeWidth="4" fill="none" />
          <line x1="108" y1="56" x2="120" y2="56" stroke="#64748B" strokeWidth="4" strokeLinecap="round" />

          {/* Grenade Pineapple Body */}
          <ellipse cx="100" cy="140" rx="50" ry="65" fill="#4D6B42" stroke="#2B3E25" strokeWidth="3" />

          {/* Body Segments Grid */}
          {/* Vertical Ribs */}
          <path d="M72 88 C 68 135, 68 155, 74 192" stroke="#2B3E25" strokeWidth="3" fill="none" />
          <path d="M100 76 L 100 205" stroke="#2B3E25" strokeWidth="3" fill="none" />
          <path d="M128 88 C 132 135, 132 155, 126 192" stroke="#2B3E25" strokeWidth="3" fill="none" />

          {/* Horizontal Groove Ribs */}
          <path d="M58 108 C 80 114, 120 114, 142 108" stroke="#2B3E25" strokeWidth="3" fill="none" />
          <path d="M52 138 C 76 146, 124 146, 148 138" stroke="#2B3E25" strokeWidth="3" fill="none" />
          <path d="M56 168 C 78 175, 122 175, 144 168" stroke="#2B3E25" strokeWidth="3" fill="none" />

          {/* Metallic lighting highlights */}
          <path
            d="M74 100 C 66 125, 68 150, 72 165"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
          <ellipse cx="94" cy="94" rx="8" ry="4" fill="rgba(255,255,255,0.4)" />
        </svg>
      </div>
    );
  }

  if (type === 'heart') {
    return (
      <div
        className={`relative flex items-center justify-center transition-transform animate-pulse ${className}`}
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full drop-shadow-2xl"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <ellipse cx="100" cy="180" rx="50" ry="12" fill="rgba(239,68,68,0.2)" filter="blur(6px)" />
          <path
            d="M100 165 C 100 165, 30 115, 30 65 C 30 38, 52 20, 78 20 C 92 20, 100 28, 100 28 C 100 28, 108 20, 122 20 C 148 20, 170 38, 170 65 C 170 115, 100 165, 100 165 Z"
            fill="url(#heartGradient)"
            stroke="#DC2626"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Specular highlight */}
          <path
            d="M55 48 C 50 62, 54 75, 62 82"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="heartGradient" x1="50" y1="20" x2="150" y2="170" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FF4B72" />
              <stop offset="0.6" stopColor="#EF4444" />
              <stop offset="1" stopColor="#B91C1C" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  if (type === 'gift') {
    // 3D Gift Box with shimmering golden/magenta ribbon and ornate bow
    return (
      <div
        className={`relative flex items-center justify-center transition-transform hover:scale-105 ${className}`}
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full drop-shadow-2xl"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Ground shadow */}
          <ellipse cx="100" cy="180" rx="56" ry="14" fill="rgba(0,0,0,0.16)" filter="blur(6px)" />

          {/* Box Bottom / Base */}
          <rect x="52" y="92" width="96" height="80" rx="10" fill="#E11D48" stroke="#9F1239" strokeWidth="2.5" />
          
          {/* Base Vertical Ribbon */}
          <rect x="91" y="92" width="18" height="80" fill="#FBBF24" />
          <line x1="100" y1="92" x2="100" y2="172" stroke="#D97706" strokeWidth="1" strokeDasharray="2 2" />

          {/* Box Lid (slight overhang) */}
          <rect x="46" y="68" width="108" height="26" rx="8" fill="#F43F5E" stroke="#9F1239" strokeWidth="2.5" />

          {/* Lid Ribbon */}
          <rect x="91" y="68" width="18" height="26" fill="#FCD34D" />

          {/* Ornate Gold Ribbon Loops on Top */}
          {/* Left Loop */}
          <path
            d="M93 70 C 65 30, 48 56, 88 68 Z"
            fill="#FBBF24"
            stroke="#D97706"
            strokeWidth="2"
          />
          {/* Right Loop */}
          <path
            d="M107 70 C 135 30, 152 56, 112 68 Z"
            fill="#FCD34D"
            stroke="#D97706"
            strokeWidth="2"
          />
          {/* Center Bow Knot */}
          <circle cx="100" cy="68" r="8" fill="#F59E0B" stroke="#B45309" strokeWidth="2" />

          {/* Sparkles around box */}
          <circle cx="40" cy="60" r="3" fill="#FDE047" className="animate-ping" />
          <circle cx="162" cy="74" r="2.5" fill="#FDE047" />
          <circle cx="148" cy="140" r="2" fill="#FDE047" />
        </svg>
      </div>
    );
  }

  if (type === 'popper') {
    // Festive party popper shooting confetti particles
    return (
      <div
        className={`relative flex items-center justify-center transition-transform ${className}`}
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full drop-shadow-2xl"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Popper Cone Body */}
          <polygon
            points="50,170 30,150 135,45 155,65"
            fill="#8B5CF6"
            stroke="#6D28D9"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Colorful Striped Bands on Cone */}
          <polygon points="62,138 46,122 75,93 91,109" fill="#EC4899" />
          <polygon points="91,109 75,93 105,63 121,79" fill="#F59E0B" />
          <polygon points="121,79 105,63 135,45 151,61" fill="#10B981" />

          {/* Popper Cone Rim */}
          <ellipse cx="145" cy="55" rx="16" ry="12" transform="rotate(-45 145 55)" fill="#6366F1" stroke="#4338CA" strokeWidth="2" />

          {/* Streamers bursting out of cone mouth */}
          <path
            d="M148 48 Q 170 25, 185 30 T 195 18"
            stroke="#EC4899"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M155 58 Q 180 50, 192 65"
            stroke="#F59E0B"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M140 40 Q 155 15, 175 10"
            stroke="#3B82F6"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />

          {/* Floating confetti dots and stars */}
          <circle cx="165" cy="22" r="3.5" fill="#EF4444" />
          <circle cx="180" cy="45" r="4" fill="#10B981" />
          <circle cx="160" cy="70" r="3" fill="#8B5CF6" />
          <rect x="185" y="32" width="6" height="6" rx="1" fill="#FBBF24" transform="rotate(25 185 32)" />
        </svg>
      </div>
    );
  }

  if (type === 'confetti_bomb') {
    // Explosive party bomb covered with stars and burning rainbow fuse
    return (
      <div
        className={`relative flex items-center justify-center transition-transform hover:scale-105 ${className}`}
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 200 220"
          className="w-full h-full drop-shadow-2xl"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Ground shadow */}
          <ellipse cx="100" cy="205" rx="55" ry="12" fill="rgba(0,0,0,0.18)" filter="blur(6px)" />

          {/* Fuse Tube & Burning Spark */}
          <path
            d="M100 60 Q 120 30, 140 38"
            stroke="#78716C"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
          {/* Sparkler on fuse tip */}
          <circle cx="140" cy="38" r="7" fill="#F59E0B" className="animate-ping" />
          <circle cx="140" cy="38" r="4" fill="#EF4444" />
          <line x1="140" y1="28" x2="140" y2="48" stroke="#FDE047" strokeWidth="2" strokeLinecap="round" />
          <line x1="130" y1="38" x2="150" y2="38" stroke="#FDE047" strokeWidth="2" strokeLinecap="round" />

          {/* Bomb Neck Collar */}
          <rect x="88" y="56" width="24" height="12" rx="3" fill="#1E293B" stroke="#0F172A" strokeWidth="2" />

          {/* Bomb Main Sphere Body */}
          <circle cx="100" cy="130" r="65" fill="#0F172A" stroke="#334155" strokeWidth="3" />

          {/* Glossy lighting highlight */}
          <ellipse cx="78" cy="100" rx="14" ry="7" fill="rgba(255,255,255,0.25)" transform="rotate(-30 78 100)" />

          {/* Decorative Celebration Confetti Stars Painted on Bomb */}
          {/* Star 1 - Yellow */}
          <polygon points="100,95 103,103 111,104 105,110 107,118 100,113 93,118 95,110 89,104 97,103" fill="#FBBF24" />
          {/* Star 2 - Pink */}
          <polygon points="125,125 127,131 133,132 128,136 130,142 125,138 120,142 122,136 117,132 123,131" fill="#F43F5E" />
          {/* Star 3 - Cyan */}
          <polygon points="75,135 77,141 83,142 78,146 80,152 75,148 70,152 72,146 67,142 73,141" fill="#06B6D4" />
          {/* Star 4 - Emerald */}
          <polygon points="100,150 102,156 108,157 103,161 105,167 100,163 95,167 97,161 92,157 98,156" fill="#10B981" />
        </svg>
      </div>
    );
  }

  // Fallback
  return (
    <div
      className={`relative flex items-center justify-center transition-transform ${className}`}
      style={{ width: size, height: size }}
    >
      <div className="text-8xl drop-shadow-2xl select-none">✨</div>
    </div>
  );
};
