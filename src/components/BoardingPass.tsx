import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, ObjectType, ThrowItem } from '../types';
import { calculateDeliveryTime, generateTrackingNumber, formatCourierDate } from '../utils/delivery';
import { sounds } from '../utils/audio';
import { Plane, Scissors, X, MapPin, Flag, Navigation, ChevronsRight } from 'lucide-react';

interface BoardingPassProps {
  sender: UserProfile;
  recipient: UserProfile;
  objectType: ObjectType;
  content: string;
  distanceMiles: number;
  isFastTravel: boolean;
  onConfirmDispatch: (throwData: Partial<ThrowItem>) => void;
  onCancel: () => void;
}

// Realistic barcode graphic generator with varied bar widths
const BarcodeGraphic = ({ code }: { code: string }) => {
  const bars = [3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 4, 2, 2, 1, 3, 4, 1, 2, 3, 2, 1, 3, 1, 4, 2, 1, 3, 2, 4, 1, 3, 2];
  return (
    <div className="flex flex-col items-center select-none">
      <div className="flex items-stretch h-9 sm:h-10 space-x-[2px] opacity-85">
        {bars.map((w, idx) => (
          <div
            key={idx}
            className="bg-stone-900 rounded-xs"
            style={{ width: `${w * 1.35}px` }}
          />
        ))}
      </div>
      <span className="font-mono text-[9px] tracking-[0.25em] text-stone-600 mt-1 uppercase font-semibold">
        *{code}*
      </span>
    </div>
  );
};

export const BoardingPass: React.FC<BoardingPassProps> = ({
  sender,
  recipient,
  objectType,
  content,
  distanceMiles,
  isFastTravel,
  onConfirmDispatch,
  onCancel
}) => {
  const [isRipped, setIsRipped] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [trackingNumber] = useState(() => generateTrackingNumber('AIR'));

  // Calculate departure and scheduled arrival
  const departureTime = Date.now();
  const deliveryCalc = calculateDeliveryTime(distanceMiles, isFastTravel);
  const scheduledArrival = departureTime + deliveryCalc.delayMs;

  const RIP_THRESHOLD = 95;

  const cargoManifestMap: Record<ObjectType, { name: string; tag: string; icon: string; warning: string }> = {
    letter: {
      name: 'Airmail Handwritten Letter',
      tag: 'DOC-FIRST-CLASS',
      icon: '✉️',
      warning: 'SEALED PERSONAL CORRESPONDENCE • HANDLE WITH CARE'
    },
    grenade: {
      name: 'Pineapple Frag Grenade',
      tag: 'HAZMAT-CLASS-1',
      icon: '💣',
      warning: 'HIGH-PRIORITY FRIENDSHIP PRANK • ARMED FOR IMPACT'
    },
    heart: {
      name: 'Express Love & Warmth',
      tag: 'PERISHABLE-LOVE',
      icon: '❤️',
      warning: 'CONTAINS MAXIMUM AFFECTION • DO NOT EXPOSE TO APATHY'
    },
    gift: {
      name: 'Surprise Luxury Gift Parcel',
      tag: 'PARCEL-PRIORITY',
      icon: '🎁',
      warning: 'WRAPPED SURPRISE • DO NOT SHAKE VIGOROUSLY'
    },
    popper: {
      name: 'Pressurized Party Popper',
      tag: 'CELEBRATION-AIR',
      icon: '🎉',
      warning: 'PRESSURIZED STREAMERS • HIGH VIBRATION SHIPMENT'
    },
    confetti_bomb: {
      name: '360° Confetti Bomb',
      tag: 'FESTIVE-EXPLOSIVE',
      icon: '🎊',
      warning: 'EXTREME GLITTER DISPERSAL • PARTY BLAST AUTHORIZED'
    }
  };

  const cargo = cargoManifestMap[objectType] || cargoManifestMap.letter;

  const triggerRip = () => {
    if (isRipped) return;
    setIsRipped(true);

    // Play synthetic paper-rip audio and rubber stamp punch
    sounds.playPaperRip();
    setTimeout(() => {
      sounds.playStamp();
    }, 280);

    const throwPayload: Partial<ThrowItem> = {
      senderId: sender.id,
      senderName: sender.name,
      senderAvatar: sender.avatar,
      senderCity: sender.city,
      senderLat: sender.lat,
      senderLng: sender.lng,
      receiverId: recipient.id,
      receiverName: recipient.name,
      receiverAvatar: recipient.avatar,
      receiverCity: recipient.city,
      receiverLat: recipient.lat,
      receiverLng: recipient.lng,
      objectType,
      content,
      status: 'in_flight',
      distanceMiles,
      createdAt: departureTime,
      departure_time: departureTime,
      scheduled_arrival: scheduledArrival,
      trackingNumber,
      isFastTravel
    };

    // Stamping animation completes, then confirm dispatch
    setTimeout(() => {
      onConfirmDispatch(throwPayload);
    }, 1350);
  };

  const ripProgress = Math.min(Math.max(dragOffset / RIP_THRESHOLD, 0), 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-md select-none overflow-y-auto">
      <div className="relative w-full max-w-4xl">
        {/* Close Button */}
        {!isRipped && (
          <button
            onClick={() => {
              sounds.playSnap();
              onCancel();
            }}
            title="Cancel Dispatch"
            className="absolute -top-4 -right-2 sm:-top-5 sm:-right-4 z-20 p-2 rounded-full bg-stone-900/90 hover:bg-stone-900 text-stone-300 hover:text-white shadow-xl transition-all active:scale-95"
          >
            <X size={18} />
          </button>
        )}

        {/* The Physical Courier Boarding Pass Ticket */}
        <div className="relative flex flex-col md:flex-row bg-paper-grain paper-texture text-stone-800 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.45)] border border-amber-200/60 overflow-hidden font-mono">
          
          {/* Watermark Security Seal Background */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.035] flex items-center justify-center overflow-hidden">
            <div className="text-[180px] sm:text-[230px] font-black tracking-tighter uppercase font-mono transform -rotate-25 select-none text-stone-900">
              THROW
            </div>
          </div>

          {/* Top Decorative Accent Stripe */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-600 via-amber-500 to-blue-600 z-10" />

          {/* MAIN TICKET BODY (LEFT SECTION: SHIPPING & CARGO METRICS) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 p-5 sm:p-7 pt-6 sm:pt-7 flex flex-col justify-between relative z-10"
          >
            <div>
              {/* Header Bar */}
              <div className="flex items-start justify-between border-b-2 border-dashed border-stone-300 pb-4 mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-orange-500/20">
                    <Plane size={20} className="transform -rotate-45" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold tracking-tight text-base sm:text-lg text-stone-900">
                        THROW AIR COURIER
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200">
                        EXPRESS PARCEL
                      </span>
                    </div>
                    <div className="font-mono text-[11px] text-stone-500">
                      BILL OF LADING: #{trackingNumber}
                    </div>
                  </div>
                </div>

                {/* Rubber Stamp: PRIORITY DISPATCH */}
                <div className="stamp-grunge border-2 border-red-600 text-red-600 font-mono font-bold px-2.5 py-1 rounded text-xs tracking-wider uppercase border-dashed flex flex-col items-center shadow-xs">
                  <div className="text-[8px] tracking-widest text-red-500">AUTHORIZED</div>
                  <span className="text-xs sm:text-sm font-black tracking-widest">PRIORITY AIR</span>
                  <div className="text-[8px] tracking-tight text-red-700">CLASS I ORBIT</div>
                </div>
              </div>

              {/* Core Flight Route Matrix (3 columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 bg-stone-100/80 p-3.5 sm:p-4 rounded-2xl border border-stone-200/90">
                {/* Sender (Origin) */}
                <div className="sm:border-r border-stone-200 pr-2">
                  <div className="text-[9px] font-mono uppercase font-bold tracking-wider text-stone-400 mb-1 flex items-center gap-1">
                    <MapPin size={11} className="text-orange-500" />
                    <span>ORIGIN</span>
                  </div>
                  <div className="font-sans font-bold text-sm sm:text-base text-stone-900 truncate">
                    {sender.city.split(',')[0]}
                  </div>
                  <div className="font-mono text-xs text-stone-600 truncate mt-0.5">
                    {sender.name}
                  </div>
                  <div className="font-mono text-[9px] text-stone-400 mt-1 uppercase">
                    DEP: {formatCourierDate(departureTime)}
                  </div>
                </div>

                {/* Mid Flight Vector Info */}
                <div className="flex flex-col items-center justify-center py-2 sm:py-0 px-2 sm:border-r border-stone-200">
                  <div className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 mb-1">
                    {distanceMiles.toLocaleString()} MILES
                  </div>
                  <div className="relative w-full flex items-center justify-center my-1">
                    <div className="w-full h-[2px] bg-stone-300"></div>
                    <div className="absolute bg-[#F8F5EC] px-1.5 text-stone-700">
                      <Navigation size={13} className="transform rotate-90 text-orange-500 fill-orange-500" />
                    </div>
                  </div>
                  <div className="text-[9px] font-mono text-stone-500 tracking-tight uppercase">
                    {deliveryCalc.category.toUpperCase()} • {isFastTravel ? 'FAST TRAVEL' : 'ORBITAL'}
                  </div>
                </div>

                {/* Receiver Destination */}
                <div className="pl-2">
                  <div className="text-[9px] font-mono uppercase font-bold tracking-wider text-stone-400 mb-1 flex items-center gap-1">
                    <Flag size={11} className="text-red-500" />
                    <span>DESTINATION</span>
                  </div>
                  <div className="font-sans font-bold text-sm sm:text-base text-stone-900 truncate">
                    {recipient.city.split(',')[0]}
                  </div>
                  <div className="font-mono text-xs text-stone-600 truncate mt-0.5">
                    {recipient.name}
                  </div>
                  <div className="font-mono text-[9px] text-indigo-700 font-bold mt-1 uppercase">
                    ETA: {formatCourierDate(scheduledArrival)}
                  </div>
                </div>
              </div>

              {/* Cargo Specification & Authentication Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 pt-1">
                <div>
                  <div className="text-[9px] font-mono uppercase font-bold text-stone-400 mb-1">
                    CONTAINED CARGO PAYLOAD
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <span className="text-2xl filter drop-shadow-xs">{cargo.icon}</span>
                    <div>
                      <span className="font-sans font-extrabold tracking-tight text-stone-800 text-xs sm:text-sm">
                        {cargo.name}
                      </span>
                      <div className="text-[10px] font-mono text-stone-500 flex items-center gap-1.5 mt-0.5">
                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>{cargo.warning}</span>
                      </div>
                    </div>
                  </div>
                  {content && (
                    <p className="text-xs text-stone-700 font-sans mt-2 line-clamp-2 border-l-2 border-stone-300 pl-2">
                      "{content}"
                    </p>
                  )}
                </div>

                {/* Barcode & Security Digits */}
                <div className="self-center sm:self-auto shrink-0">
                  <BarcodeGraphic code={`TH-${recipient.name.slice(0, 3).toUpperCase()}-${trackingNumber.slice(-4)}`} />
                </div>
              </div>
            </div>

            {/* Red Rubber Stamp Effect on Rip */}
            <AnimatePresence>
              {isRipped && (
                <motion.div
                  initial={{ scale: 2.2, opacity: 0, rotate: -25 }}
                  animate={{ scale: 1, opacity: 0.96, rotate: -14 }}
                  transition={{ type: 'spring', damping: 14, stiffness: 220 }}
                  className="absolute inset-0 m-auto w-72 h-28 border-4 border-red-600 rounded-xl flex flex-col items-center justify-center p-2 pointer-events-none shadow-lg z-30 bg-red-50/25 backdrop-blur-[1px]"
                >
                  <span className="text-2xl font-black text-red-600 tracking-widest uppercase">
                    ★ DISPATCHED ★
                  </span>
                  <span className="text-[11px] font-bold text-red-600 tracking-wider mt-0.5">
                    CLEARED FOR COURIER FLIGHT
                  </span>
                  <span className="text-[9px] text-red-500 font-mono mt-0.5">
                    AIRWAY #{trackingNumber}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* PERFORATION TEAR DIVIDER (The visual seam with cutouts) */}
          <div className="relative flex md:flex-col items-center justify-center my-[-8px] md:my-0 md:mx-[-1px] z-20 pointer-events-none">
            {/* Dashed Tear Line */}
            <div
              className="w-full md:w-[2px] h-[2px] md:h-full border-t-2 md:border-t-0 md:border-l-2 border-dashed transition-colors duration-200"
              style={{
                borderColor: dragOffset > 30 ? '#EA580C' : '#CBD5E1',
                boxShadow: dragOffset > 30 ? '0 0 8px rgba(234, 88, 12, 0.4)' : 'none'
              }}
            />

            {/* Center Scissor Marker Badge */}
            <motion.div
              animate={{
                scale: dragOffset > 30 ? [1, 1.25, 1.1] : 1,
                rotate: dragOffset > 30 ? -15 : 0
              }}
              className={`absolute w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono border shadow-md transition-colors ${
                dragOffset > 45
                  ? 'bg-orange-500 text-white border-orange-400'
                  : 'bg-stone-100 text-stone-600 border-stone-300'
              }`}
            >
              <Scissors size={15} className="transform md:rotate-90" />
            </motion.div>

            {/* Top hole punch cutout */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 md:top-0 md:-left-4 w-8 h-8 rounded-full bg-slate-950 shadow-inner pointer-events-none" />
            {/* Bottom hole punch cutout */}
            <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 md:bottom-0 md:-left-4 w-8 h-8 rounded-full bg-slate-950 shadow-inner pointer-events-none" />
          </div>

          {/* DRAGGABLE / TEARABLE STUB (Right Section) */}
          <motion.div
            drag={!isRipped ? 'x' : false}
            dragConstraints={{ left: 0, right: 280 }}
            dragElastic={0.15}
            onDrag={(_, info) => {
              if (isRipped) return;
              setDragOffset(info.offset.x);
            }}
            onDragEnd={(_, info) => {
              if (isRipped) return;
              if (info.offset.x > RIP_THRESHOLD || info.velocity.x > 220) {
                triggerRip();
              } else {
                setDragOffset(0);
              }
            }}
            animate={
              isRipped
                ? {
                    y: 850,
                    x: 220,
                    rotate: 48,
                    opacity: 0,
                    transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] }
                  }
                : {
                    x: dragOffset,
                    rotate: dragOffset * 0.04
                  }
            }
            className={`w-full md:w-68 bg-[#F5F0E4] p-5 sm:p-6 text-stone-800 border-t md:border-t-0 md:border-l border-amber-200/60 z-30 cursor-grab active:cursor-grabbing flex flex-col justify-between overflow-hidden relative ${
              dragOffset > 10 ? 'ring-2 ring-orange-500/50 shadow-2xl' : 'shadow-lg'
            }`}
            style={{ touchAction: 'none' }}
          >
            {/* Jagged Torn Edge Highlight during Pull */}
            {dragOffset > 0 && (
              <div
                className="absolute inset-y-0 left-0 w-3 torn-edge pointer-events-none"
                style={{ opacity: Math.min(dragOffset / 60, 0.9) }}
              />
            )}

            <div>
              {/* Stub Header */}
              <div className="flex items-center justify-between border-b border-stone-300 pb-2.5 mb-3">
                <div className="flex items-center space-x-1 text-orange-600 font-mono font-bold text-xs uppercase tracking-wider">
                  <span>COURIER STUB</span>
                </div>
                <span className="font-mono text-[10px] text-stone-400 font-semibold">
                  #STUB-01
                </span>
              </div>

              {/* Receiver Callout */}
              <div className="mb-3">
                <div className="text-[9px] font-mono uppercase text-stone-400 font-bold">
                  RECIPIENT
                </div>
                <div className="font-sans font-bold text-base text-stone-900 leading-tight mt-0.5 truncate">
                  {recipient.name}
                </div>
                <div className="font-mono text-xs text-stone-500 truncate">
                  {recipient.city}
                </div>
              </div>

              {/* Manifest Summary Box */}
              <div className="bg-stone-100/90 rounded-xl p-2.5 border border-stone-200/80 mb-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono uppercase font-bold text-stone-500">PAYLOAD</span>
                  <span className="text-base">{cargo.icon}</span>
                </div>
                <div className="font-sans font-extrabold tracking-tight text-stone-800 truncate mt-0.5 text-xs">
                  {cargo.name}
                </div>
                <div className="font-mono text-[10px] text-orange-600 font-bold mt-0.5">
                  BALLISTIC: {distanceMiles.toLocaleString()} MI
                </div>
              </div>
            </div>

            {/* Tear Indicator & Pull Handle */}
            <div className="mt-3 pt-3 border-t border-dashed border-stone-300">
              <div className="flex items-center justify-center space-x-1.5 text-stone-600 mb-2">
                <ChevronsRight
                  size={15}
                  className={`transition-transform ${dragOffset > 25 ? 'translate-x-1 text-orange-600' : 'text-stone-400'}`}
                />
                <span className="font-mono text-xs font-bold tracking-wider uppercase text-stone-800">
                  {isRipped ? 'TEARING CONFIRMED...' : 'SLIDE TO RIP'}
                </span>
                <ChevronsRight
                  size={15}
                  className={`transition-transform ${dragOffset > 25 ? 'translate-x-1 text-orange-600' : 'text-stone-400'}`}
                />
              </div>

              {/* Progress bar visual indicator */}
              <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden p-[1px]">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-600 rounded-full transition-all"
                  style={{ width: `${ripProgress * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] font-mono text-stone-400 mt-1 px-0.5">
                <span>HOLD STUB</span>
                <span className={ripProgress >= 1 ? 'text-red-600 font-bold' : ''}>
                  {ripProgress >= 1 ? 'RELEASE TO DISPATCH' : 'DRAG TO TEAR'}
                </span>
              </div>

              {/* Quick Click Button Fallback */}
              {!isRipped && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerRip();
                  }}
                  className="w-full mt-2.5 py-2 px-3 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
                >
                  <Scissors size={13} />
                  <span>Click to Rip & Dispatch</span>
                </button>
              )}
            </div>
          </motion.div>
        </div>

        {/* Vintage Bottom Helper Note */}
        {!isRipped && (
          <div className="mt-3 text-center text-xs text-stone-300/80">
            <span>Realistic Postal Transit: Object traverses space and arrives according to calculated real-world distance.</span>
          </div>
        )}
      </div>
    </div>
  );
};
