import React, { useState, useEffect } from 'react';
import { ThrowItem } from '../types';
import { sounds } from '../utils/audio';
import { formatETA, formatCourierDate } from '../utils/delivery';
import { X, Inbox as InboxIcon, Send, Clock, Trash2, Plane, CheckCircle2, Navigation } from 'lucide-react';

interface InboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  receivedThrows: ThrowItem[];
  sentThrows: ThrowItem[];
  onOpenThrow: (item: ThrowItem) => void;
  onClearHistory?: () => void;
  initialTab?: 'arrived' | 'transit' | 'sent';
}

export const InboxModal: React.FC<InboxModalProps> = ({
  isOpen,
  onClose,
  receivedThrows,
  sentThrows,
  onOpenThrow,
  onClearHistory,
  initialTab = 'arrived'
}) => {
  const [activeTab, setActiveTab] = useState<'arrived' | 'transit' | 'sent'>(initialTab);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Reset tab when modal opens with initialTab
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // 1-second interval for real-time ETA countdowns
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter incoming throws into arrived vs transit
  const arrivedThrows = receivedThrows.filter((t) => {
    // If no scheduled_arrival, consider it delivered (demo throws)
    if (!t.scheduled_arrival) return true;
    return currentTime >= t.scheduled_arrival || t.status === 'delivered';
  });

  const inTransitIncoming = receivedThrows.filter((t) => {
    if (!t.scheduled_arrival) return false;
    return currentTime < t.scheduled_arrival && t.status !== 'delivered';
  });

  // Also include outgoing throws currently in transit in the Transit tab
  const inTransitOutgoing = sentThrows.filter((t) => {
    if (!t.scheduled_arrival) return false;
    return currentTime < t.scheduled_arrival;
  });

  const allTransitItems = [...inTransitIncoming, ...inTransitOutgoing];

  const getEmoji = (type: string) => {
    switch (type) {
      case 'grenade':
        return '💣';
      case 'heart':
        return '❤️';
      case 'gift':
        return '🎁';
      case 'popper':
        return '🎉';
      case 'confetti_bomb':
        return '🎊';
      default:
        return '✈️';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md select-none">
      <div className="relative w-full max-w-md bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/80 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-800">
              <InboxIcon size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">Mail & Courier Log</h2>
              <p className="text-[11px] text-slate-500">Spatial items & physical transit tracking</p>
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

        {/* Tab switchers: Arrived vs In Transit vs Sent */}
        <div className="flex p-1.5 mx-6 mt-3 bg-slate-100 rounded-2xl gap-1">
          <button
            onClick={() => {
              sounds.playSnap();
              setActiveTab('arrived');
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all relative ${
              activeTab === 'arrived'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Arrived</span>
            {arrivedThrows.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-emerald-500 text-white text-[10px] font-bold rounded-full">
                {arrivedThrows.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              sounds.playSnap();
              setActiveTab('transit');
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all relative ${
              activeTab === 'transit'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>In Transit</span>
            {allTransitItems.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-white text-[10px] font-bold rounded-full animate-pulse">
                {allTransitItems.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              sounds.playSnap();
              setActiveTab('sent');
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'sent'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Sent ({sentThrows.length})</span>
          </button>
        </div>

        {/* TAB 1: ARRIVED THROWS (Ready to open!) */}
        {activeTab === 'arrived' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-3 no-scrollbar min-h-[260px]">
            {arrivedThrows.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center text-slate-400">
                <div className="text-4xl mb-2 select-none">📭</div>
                <p className="text-sm font-semibold text-slate-700">No arrived mail</p>
                <p className="text-xs text-slate-400 mt-1 max-w-[240px]">
                  Items currently en route appear under "In Transit" until courier arrives at your coordinates.
                </p>
              </div>
            ) : (
              arrivedThrows.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    sounds.playSnap();
                    onOpenThrow(item);
                    onClose();
                  }}
                  className="group relative flex items-center justify-between p-3.5 bg-slate-50 hover:bg-indigo-50/50 rounded-2xl border border-slate-200/70 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={item.senderAvatar}
                        alt={item.senderName}
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-white shadow-sm"
                      />
                      <span className="absolute -bottom-1 -right-1 text-base select-none">
                        {getEmoji(item.objectType)}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-slate-900">
                          {item.senderName}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1">
                          <CheckCircle2 size={10} />
                          <span>Arrived</span>
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                        {item.content || `Arrived from ${item.senderCity}`}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        From {item.senderCity} • {item.distanceMiles} mi
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end">
                    <span className="px-3 py-1 bg-indigo-600 group-hover:bg-indigo-700 text-white rounded-full text-xs font-bold shadow-xs transition-colors">
                      Open
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: IN TRANSIT THROWS (Live ETA & Courier Flight Progress) */}
        {activeTab === 'transit' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-3 no-scrollbar min-h-[260px]">
            {allTransitItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center text-slate-400">
                <div className="text-4xl mb-2 select-none">✈️</div>
                <p className="text-sm font-semibold text-slate-700">No items currently in transit</p>
                <p className="text-xs text-slate-400 mt-1 max-w-[240px]">
                  Throw an item to Maya, Saara, or another friend to initiate realistic physical mail courier flight.
                </p>
              </div>
            ) : (
              allTransitItems.map((item) => {
                const etaInfo = item.scheduled_arrival
                  ? formatETA(item.scheduled_arrival, currentTime)
                  : { text: 'In flight', isDelivered: false, progressPercent: 50 };

                // Calculate progress bar percent
                const totalDuration = (item.scheduled_arrival || 0) - (item.departure_time || item.createdAt);
                const elapsed = currentTime - (item.departure_time || item.createdAt);
                const progressPct = totalDuration > 0
                  ? Math.min(99, Math.max(5, Math.round((elapsed / totalDuration) * 100)))
                  : 50;

                return (
                  <div
                    key={item.id}
                    className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-2.5 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getEmoji(item.objectType)}</span>
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            {item.senderName} ➔ {item.receiverName}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Waybill #{item.trackingNumber || item.id.slice(0, 10)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                          <Plane size={10} className="animate-pulse" />
                          <span>In Courier Transit</span>
                        </span>
                        <p className="text-[11px] font-black text-indigo-700 mt-0.5">
                          {etaInfo.text}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="w-full h-1.5 bg-amber-200/60 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-600 rounded-full transition-all duration-1000"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-400">
                        <span>{item.senderCity}</span>
                        <span>{item.distanceMiles} miles</span>
                        <span>{item.receiverCity}</span>
                      </div>
                    </div>

                    {/* Cargo note */}
                    <div className="text-[11px] text-slate-600 bg-white/70 p-2 rounded-xl border border-amber-100 italic line-clamp-1">
                      "{item.content || 'Courier parcel'}"
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 3: SENT THROWS */}
        {activeTab === 'sent' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-3 no-scrollbar min-h-[260px]">
            {sentThrows.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center text-slate-400">
                <div className="text-4xl mb-2 select-none">📤</div>
                <p className="text-sm font-semibold text-slate-700">No sent throws yet</p>
                <p className="text-xs text-slate-400 mt-1">
                  Select a friend on the map and throw a letter, grenade, gift, or popper!
                </p>
              </div>
            ) : (
              sentThrows.map((item) => {
                const isArrived =
                  !item.scheduled_arrival ||
                  currentTime >= item.scheduled_arrival ||
                  item.status === 'delivered';

                return (
                  <div
                    key={item.id}
                    className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={item.receiverAvatar}
                          alt={item.receiverName}
                          className="w-11 h-11 rounded-full object-cover ring-2 ring-white shadow-sm"
                        />
                        <span className="absolute -bottom-1 -right-1 text-base select-none">
                          {getEmoji(item.objectType)}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-slate-900">
                            To {item.receiverName}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              isArrived
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800 animate-pulse'
                            }`}
                          >
                            {isArrived ? 'Delivered' : 'In Transit'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1">
                          {item.content}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {item.receiverCity} • {item.distanceMiles} mi
                        </p>
                      </div>
                    </div>

                    <div className="text-right text-[10px] text-slate-400">
                      {formatCourierDate(item.createdAt)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Bottom bar */}
        {onClearHistory && (
          <div className="px-6 py-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
            <span>Realistic Postal Courier Simulation</span>
            <button
              onClick={onClearHistory}
              className="text-slate-400 hover:text-red-600 flex items-center gap-1 transition-colors"
            >
              <Trash2 size={13} />
              <span>Reset Log</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

