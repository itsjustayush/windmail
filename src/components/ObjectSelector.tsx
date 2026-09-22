import React from 'react';
import { ObjectType } from '../types';
import { sounds } from '../utils/audio';

interface ObjectSelectorProps {
  currentObject: ObjectType;
  onSelectObject: (type: ObjectType) => void;
  isOpen: boolean;
  onClose: () => void;
}

const OBJECT_OPTIONS: { type: ObjectType; label: string; icon: string; countName: string }[] = [
  { type: 'letter', label: 'Paper Letter', icon: '✈️', countName: 'letters' },
  { type: 'grenade', label: 'Prank Grenade', icon: '💣', countName: 'grenades' },
  { type: 'heart', label: 'Heart', icon: '❤️', countName: 'love' },
  { type: 'gift', label: 'Gift Box', icon: '🎁', countName: 'gifts' },
  { type: 'popper', label: 'Party Popper', icon: '🎉', countName: 'poppers' },
  { type: 'confetti_bomb', label: 'Confetti Bomb', icon: '🎊', countName: 'confettiBombs' }
];

export const ObjectSelector: React.FC<ObjectSelectorProps> = ({
  currentObject,
  onSelectObject,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/15 backdrop-blur-[2px]">
      <div
        className="bg-white/95 backdrop-blur-2xl p-4 sm:p-5 rounded-3xl shadow-2xl border border-white/80 max-w-sm w-full mx-4 transition-all transform scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center pb-2.5 mb-3 border-b border-slate-100">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Equip Item to Throw
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Choose an object to throw across the map
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {OBJECT_OPTIONS.map((item) => {
            const isEquipped = currentObject === item.type;
            return (
              <button
                key={item.type}
                onClick={() => {
                  sounds.playSnap();
                  onSelectObject(item.type);
                  onClose();
                }}
                className={`flex flex-col items-center justify-center p-2.5 rounded-2xl transition-all duration-200 ${
                  isEquipped
                    ? 'bg-slate-900 text-white shadow-lg scale-105 ring-2 ring-indigo-500/50'
                    : 'hover:bg-slate-100 text-slate-700 bg-slate-50/70 border border-slate-200/50'
                }`}
              >
                <span className="text-3xl mb-1 select-none">{item.icon}</span>
                <span className="text-xs font-semibold leading-tight truncate w-full text-center">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 text-center rounded-xl hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
