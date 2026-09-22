import React, { useState } from 'react';
import { UserProfile, FriendRequest } from '../types';
import { ALL_DIRECTORY_USERS } from '../utils/geo';
import { sounds } from '../utils/audio';
import { X, Search, UserPlus, Check, UserCheck, Clock, UserX, Users } from 'lucide-react';

interface FriendRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  friends: UserProfile[];
  pendingReceivedRequests: FriendRequest[];
  pendingSentRequests: FriendRequest[];
  onSendRequest: (targetUser: UserProfile) => void;
  onAcceptRequest: (request: FriendRequest) => void;
  onDeclineRequest: (request: FriendRequest) => void;
}

export const FriendRequestsModal: React.FC<FriendRequestsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  friends,
  pendingReceivedRequests,
  pendingSentRequests,
  onSendRequest,
  onAcceptRequest,
  onDeclineRequest
}) => {
  const [activeTab, setActiveTab] = useState<'search' | 'requests'>('search');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  // Search logic across directory users
  const normalizedQuery = searchQuery.trim().toLowerCase().replace(/^@/, '');
  const searchResults = normalizedQuery
    ? ALL_DIRECTORY_USERS.filter((user) => {
        if (user.id === currentUser.id) return false;
        const matchesUsername = user.username?.toLowerCase().includes(normalizedQuery);
        const matchesName = user.name.toLowerCase().includes(normalizedQuery);
        const matchesCity = user.city.toLowerCase().includes(normalizedQuery);
        return matchesUsername || matchesName || matchesCity;
      })
    : ALL_DIRECTORY_USERS.filter((user) => user.id !== currentUser.id);

  const isFriend = (userId: string) => friends.some((f) => f.id === userId);
  const isRequestPendingSent = (userId: string) =>
    pendingSentRequests.some((r) => r.receiverId === userId && r.status === 'pending');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md select-none">
      <div className="relative w-full max-w-md bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/80 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Users size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">Find & Add Friends</h2>
              <p className="text-[11px] text-slate-500">Connect to throw items across coordinates</p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playSnap();
              onClose();
            }}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab switchers: Search vs Requests */}
        <div className="flex p-1.5 mx-6 mt-3 bg-slate-100 rounded-2xl">
          <button
            onClick={() => {
              sounds.playSnap();
              setActiveTab('search');
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'search'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Search Directory
          </button>
          <button
            onClick={() => {
              sounds.playSnap();
              setActiveTab('requests');
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all relative ${
              activeTab === 'requests'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Requests</span>
            {pendingReceivedRequests.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-indigo-600 text-white font-bold rounded-full">
                {pendingReceivedRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: SEARCH USERS BY USERNAME */}
        {activeTab === 'search' && (
          <div className="p-6 flex flex-col flex-1 overflow-hidden">
            {/* Search Input with Name or Username Filtering */}
            <div className="relative mb-2">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search friend by name or @username..."
                className="w-full pl-10 pr-9 py-2.5 bg-slate-100 hover:bg-slate-100/80 focus:bg-white text-xs font-medium text-slate-900 rounded-2xl border border-transparent focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Quick Filter Suggestion Chips */}
            <div className="flex items-center gap-1.5 pb-3 pt-1 overflow-x-auto no-scrollbar">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider whitespace-nowrap">
                Quick:
              </span>
              {['@maya', '@saara', '@chloe', '@liam', '@kenji', '@priya'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    sounds.playSnap();
                    setSearchQuery(tag);
                  }}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-colors whitespace-nowrap ${
                    searchQuery === tag
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 no-scrollbar pr-1 min-h-[240px]">
              {searchResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-44 text-slate-400 text-center">
                  <p className="text-xs font-medium text-slate-500">No users found for "{searchQuery}"</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Try searching for Chloe, Liam, Kenji, Priya, Maya, or Saara
                  </p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-2 text-xs text-indigo-600 font-bold hover:underline"
                  >
                    View all directory users
                  </button>
                </div>
              ) : (
                searchResults.map((user) => {
                  const alreadyFriend = isFriend(user.id);
                  const isPending = isRequestPendingSent(user.id);

                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/60 hover:bg-slate-100/80 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover ring-1 ring-black/10"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900 leading-tight">
                              {user.name}
                            </span>
                            <span className="text-[11px] text-indigo-600 font-semibold">
                              @{user.username || user.id}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 block leading-tight">
                            {user.city}
                          </span>
                        </div>
                      </div>

                      {alreadyFriend ? (
                        <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/50">
                          <UserCheck size={13} />
                          <span>Friends</span>
                        </div>
                      ) : isPending ? (
                        <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200/50">
                          <Clock size={13} />
                          <span>Pending</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            sounds.playSnap();
                            onSendRequest(user);
                          }}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-semibold shadow-xs active:scale-95 transition-all"
                        >
                          <UserPlus size={13} />
                          <span>Add</span>
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PENDING RECEIVED & SENT REQUESTS */}
        {activeTab === 'requests' && (
          <div className="p-6 flex-1 overflow-y-auto space-y-4 no-scrollbar min-h-[300px]">
            {/* Received Requests Section */}
            <div>
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Received Requests ({pendingReceivedRequests.length})
              </h3>
              {pendingReceivedRequests.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-50 text-center text-xs text-slate-400 border border-slate-100">
                  No incoming friend requests right now.
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingReceivedRequests.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100/80"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={req.senderAvatar}
                          alt={req.senderUsername}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-400/50"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            @{req.senderUsername}
                          </p>
                          <p className="text-[11px] text-slate-500">{req.senderCity}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            sounds.playSnap();
                            onAcceptRequest(req);
                          }}
                          title="Accept Request"
                          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs active:scale-95 transition-all"
                        >
                          <Check size={13} />
                          <span>Accept</span>
                        </button>
                        <button
                          onClick={() => {
                            sounds.playSnap();
                            onDeclineRequest(req);
                          }}
                          title="Decline Request"
                          className="p-1.5 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-600 text-xs transition-colors"
                        >
                          <UserX size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sent Requests Section */}
            {pendingSentRequests.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Sent Requests ({pendingSentRequests.length})
                </h3>
                <div className="space-y-2">
                  {pendingSentRequests.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/60"
                    >
                      <div className="flex items-center gap-2.5">
                        <Clock size={15} className="text-amber-500" />
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            Waiting for @{req.receiverUsername}
                          </p>
                          <p className="text-[10px] text-slate-400">Request sent</p>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold border border-amber-200/50">
                        Pending
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
