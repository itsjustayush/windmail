import React from 'react';
import { UserProfile } from '../types';
import { sounds } from '../utils/audio';

interface FriendCarouselProps {
  friends: UserProfile[];
  selectedFriend: UserProfile;
  onSelectFriend: (friend: UserProfile) => void;
  disabled?: boolean;
}

export const FriendCarousel: React.FC<FriendCarouselProps> = ({
  friends,
  selectedFriend,
  onSelectFriend,
  disabled = false
}) => {
  const currentIndex = friends.findIndex((f) => f.id === selectedFriend.id);

  const handleSelect = (friend: UserProfile) => {
    if (disabled || friend.id === selectedFriend.id) return;
    sounds.playSnap();
    onSelectFriend(friend);
  };

  return (
    <div className="w-full flex flex-col items-center select-none pt-1 pb-2">
      {/* Horizontal Avatars Row */}
      <div className="flex items-center justify-center gap-4 sm:gap-6 relative w-full px-4 overflow-x-auto no-scrollbar py-2">
        {friends.map((friend) => {
          const isSelected = friend.id === selectedFriend.id;
          return (
            <button
              key={friend.id}
              onClick={() => handleSelect(friend)}
              disabled={disabled}
              className={`flex flex-col items-center transition-all duration-300 focus:outline-none ${
                isSelected
                  ? 'scale-115 sm:scale-120 z-10 opacity-100'
                  : 'scale-90 opacity-40 hover:opacity-75'
              }`}
            >
              <div
                className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full p-0.5 transition-all duration-300 ${
                  isSelected
                    ? 'ring-4 ring-indigo-500/80 ring-offset-2 ring-offset-white shadow-xl'
                    : 'ring-1 ring-black/10 shadow-sm'
                }`}
              >
                <img
                  src={friend.avatar}
                  alt={friend.name}
                  className="w-full h-full object-cover rounded-full pointer-events-none"
                />
              </div>

              {/* Name & City under avatar */}
              <div className="flex flex-col items-center mt-1.5 transition-opacity">
                <span
                  className={`text-sm tracking-tight ${
                    isSelected ? 'font-bold text-slate-900' : 'font-medium text-slate-500 text-xs'
                  }`}
                >
                  {friend.name}
                </span>
                <span
                  className={`text-[11px] leading-tight ${
                    isSelected ? 'font-medium text-slate-500' : 'text-slate-400 text-[10px]'
                  }`}
                >
                  {friend.city}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
