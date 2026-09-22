import React, { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import confetti from 'canvas-confetti';
import { auth, db } from './lib/firebase';
import { UserProfile, ThrowItem, ObjectType, InventoryStats, FriendRequest } from './types';
import {
  DEFAULT_FRIENDS,
  CURRENT_USER_DEFAULT,
  ALL_DIRECTORY_USERS,
  calculateDistanceMiles
} from './utils/geo';
import { sounds } from './utils/audio';
import { MapCanvas } from './components/MapCanvas';
import { FriendCarousel } from './components/FriendCarousel';
import { VirtualObject } from './components/VirtualObjects';
import { ObjectSelector } from './components/ObjectSelector';
import { LetterComposer } from './components/LetterComposer';
import { ImpactOverlay } from './components/ImpactOverlay';
import { InboxModal } from './components/InboxModal';
import { SettingsModal } from './components/SettingsModal';
import { FriendRequestsModal } from './components/FriendRequestsModal';
import { BoardingPass } from './components/BoardingPass';
import { formatCourierDate, formatETA } from './utils/delivery';
import {
  Settings,
  Inbox as InboxIcon,
  Send,
  Volume2,
  VolumeX,
  Navigation,
  UserPlus,
  CheckCircle2,
  Plane,
  Clock,
  ExternalLink
} from 'lucide-react';

export default function App() {
  // Profiles state
  const [currentUser, setCurrentUser] = useState<UserProfile>(CURRENT_USER_DEFAULT);
  const [friends, setFriends] = useState<UserProfile[]>(DEFAULT_FRIENDS);
  const [selectedFriend, setSelectedFriend] = useState<UserProfile>(DEFAULT_FRIENDS[0]); // Maya
  const [authUser, setAuthUser] = useState<User | null>(null);

  // Equipped Object & Composer State
  const [equippedObject, setEquippedObject] = useState<ObjectType>('letter');
  const [isObjectSelectorOpen, setIsObjectSelectorOpen] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerInitialText, setComposerInitialText] = useState('');

  // Flight & Transit State
  const [isFlying, setIsFlying] = useState(false);
  const [flightProgress, setFlightProgress] = useState(0); // 0 to 1
  const [currentFlightItem, setCurrentFlightItem] = useState<ThrowItem | null>(null);
  const [flightStatusText, setFlightStatusText] = useState('');
  const [displayedDistance, setDisplayedDistance] = useState(0);

  // Inbox & Realtime Throws
  const [throwsList, setThrowsList] = useState<ThrowItem[]>([]);
  const [activeImpactThrow, setActiveImpactThrow] = useState<ThrowItem | null>(null);
  const [isInboxModalOpen, setIsInboxModalOpen] = useState(false);
  const [inboxInitialTab, setInboxInitialTab] = useState<'arrived' | 'transit' | 'sent'>('arrived');
  const [incomingNotification, setIncomingNotification] = useState<ThrowItem | null>(null);
  const [courierTransitBanner, setCourierTransitBanner] = useState<ThrowItem | null>(null);
  const [senderConfirmationToast, setSenderConfirmationToast] = useState<{
    message: string;
    tracking: string;
    receiverName: string;
    etaText: string;
  } | null>(null);

  // Realistic Courier & Boarding Pass State
  const [isFastTravel, setIsFastTravel] = useState<boolean>(() => {
    const saved = localStorage.getItem('throw_fast_travel');
    return saved !== null ? saved === 'true' : true; // default true for convenient testing
  });
  const [pendingDispatch, setPendingDispatch] = useState<{
    recipient: UserProfile;
    objectType: ObjectType;
    content: string;
    distanceMiles: number;
  } | null>(null);

  // Friend Request System State
  const [isFriendRequestsOpen, setIsFriendRequestsOpen] = useState(false);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [incomingFriendRequestNotif, setIncomingFriendRequestNotif] = useState<FriendRequest | null>(null);

  // Settings & Sound
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Inventory Stats (matching the video pill + new objects)
  const [inventory, setInventory] = useState<InventoryStats>({
    letters: 48,
    grenades: 11,
    love: 14,
    gifts: 7,
    poppers: 12,
    confettiBombs: 5
  });

  const flightAnimRef = useRef<number | null>(null);

  // 1. Listen for Firebase Auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      if (user) {
        setCurrentUser((prev) => ({
          ...prev,
          id: user.uid,
          name: user.displayName || prev.name,
          username: user.email ? user.email.split('@')[0] : prev.username,
          avatar: user.photoURL || prev.avatar
        }));
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Realtime listener for Firestore throws
  useEffect(() => {
    let isInitialSnapshot = true;
    try {
      const throwsRef = collection(db, 'throws');
      const q = query(throwsRef, orderBy('createdAt', 'desc'), limit(30));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items: ThrowItem[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            items.push({
              id: docSnap.id,
              senderId: data.senderId,
              senderName: data.senderName,
              senderAvatar: data.senderAvatar,
              senderCity: data.senderCity,
              senderLat: data.senderLat,
              senderLng: data.senderLng,
              receiverId: data.receiverId,
              receiverName: data.receiverName,
              receiverAvatar: data.receiverAvatar,
              receiverCity: data.receiverCity,
              receiverLat: data.receiverLat,
              receiverLng: data.receiverLng,
              objectType: data.objectType || 'letter',
              content: data.content || '',
              status: data.status || 'delivered',
              distanceMiles: data.distanceMiles || 0,
              createdAt: data.createdAt || Date.now(),
              departure_time: data.departure_time || data.createdAt || Date.now(),
              scheduled_arrival: data.scheduled_arrival || data.createdAt || Date.now(),
              trackingNumber: data.trackingNumber,
              isFastTravel: data.isFastTravel
            });
          });

          if (items.length > 0) {
            setThrowsList(items);

            // Handle incoming notifications by explicitly checking receiverId and senderId
            snapshot.docChanges().forEach((change) => {
              if (change.type === 'added') {
                const data = change.doc.data();
                const createdAt = data.createdAt || Date.now();
                const isRecent = Date.now() - createdAt < 30000;

                // 1. Explicitly check receiverId: incoming notification is for the designated receiver only
                if (data.receiverId === currentUser.id && data.senderId !== currentUser.id) {
                  if (isRecent && change.doc.id !== incomingNotification?.id && change.doc.id !== activeImpactThrow?.id) {
                    const scheduledArrival = data.scheduled_arrival || createdAt;
                    const hasArrived = Date.now() >= scheduledArrival;

                    const throwItem: ThrowItem = {
                      id: change.doc.id,
                      senderId: data.senderId,
                      senderName: data.senderName,
                      senderAvatar: data.senderAvatar,
                      senderCity: data.senderCity,
                      senderLat: data.senderLat,
                      senderLng: data.senderLng,
                      receiverId: data.receiverId,
                      receiverName: data.receiverName,
                      receiverAvatar: data.receiverAvatar,
                      receiverCity: data.receiverCity,
                      receiverLat: data.receiverLat,
                      receiverLng: data.receiverLng,
                      objectType: data.objectType || 'letter',
                      content: data.content || '',
                      status: data.status || 'delivered',
                      distanceMiles: data.distanceMiles || 0,
                      createdAt,
                      departure_time: data.departure_time || createdAt,
                      scheduled_arrival: scheduledArrival,
                      trackingNumber: data.trackingNumber,
                      isFastTravel: data.isFastTravel
                    };

                    if (hasArrived) {
                      setIncomingNotification(throwItem);
                      setCourierTransitBanner(null);
                      if (throwItem.objectType === 'grenade') {
                        sounds.playGrenadeArm();
                      } else if (throwItem.objectType === 'gift') {
                        sounds.playGiftOpen();
                      } else if (throwItem.objectType === 'popper') {
                        sounds.playPartyPopper();
                      } else if (throwItem.objectType === 'confetti_bomb') {
                        sounds.playConfettiBomb();
                      } else {
                        sounds.playLetterOpen();
                      }
                    } else {
                      // Item is still in transit across real-world distance
                      setCourierTransitBanner(throwItem);
                    }
                  }
                }
                // 2. Explicitly check senderId: provide separate 'Dispatch Confirmed' notification only to the sender
                else if (data.senderId === currentUser.id && data.receiverId !== currentUser.id) {
                  if (isRecent && !isInitialSnapshot) {
                    const etaInfo = formatETA(data.scheduled_arrival);
                    setSenderConfirmationToast({
                      message: 'Dispatch Confirmed',
                      tracking: data.trackingNumber || 'AIR-WAYBILL',
                      receiverName: data.receiverName || 'Recipient',
                      etaText: etaInfo.text
                    });
                  }
                }
              }
            });

            isInitialSnapshot = false;
          }
        },
        (error) => {
          console.warn('Firestore real-time subscription note:', error.message);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.warn('Firestore init note:', err);
    }
  }, [currentUser.id, incomingNotification?.id, activeImpactThrow?.id]);

  // Periodic check for items in transit that arrive at destination
  useEffect(() => {
    const checkArrivals = () => {
      const now = Date.now();
      throwsList.forEach((item) => {
        if (
          item.receiverId === currentUser.id &&
          item.senderId !== currentUser.id &&
          item.scheduled_arrival &&
          now >= item.scheduled_arrival &&
          now - item.scheduled_arrival < 8000 &&
          incomingNotification?.id !== item.id &&
          activeImpactThrow?.id !== item.id
        ) {
          setIncomingNotification(item);
          setCourierTransitBanner(null);
          if (item.objectType === 'grenade') {
            sounds.playExplosion();
          } else if (item.objectType === 'gift') {
            sounds.playGiftOpen();
          } else if (item.objectType === 'popper') {
            sounds.playPartyPopper();
          } else if (item.objectType === 'confetti_bomb') {
            sounds.playConfettiBomb();
          } else {
            sounds.playLetterOpen();
          }
        }
      });
    };

    const timer = setInterval(checkArrivals, 1000);
    return () => clearInterval(timer);
  }, [throwsList, currentUser.id, incomingNotification?.id, activeImpactThrow?.id]);

  // 3. Realtime listener for Firestore Friend Requests
  useEffect(() => {
    try {
      const freqRef = collection(db, 'friend_requests');
      const q = query(freqRef, orderBy('createdAt', 'desc'), limit(40));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const reqs: FriendRequest[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            reqs.push({
              id: docSnap.id,
              senderId: data.senderId,
              senderUsername: data.senderUsername,
              senderAvatar: data.senderAvatar,
              senderCity: data.senderCity,
              receiverId: data.receiverId,
              receiverUsername: data.receiverUsername,
              status: data.status || 'pending',
              createdAt: data.createdAt || Date.now()
            });
          });

          if (reqs.length > 0) {
            setFriendRequests(reqs);

            // Check if there is a fresh pending request for currentUser
            const freshPending = reqs.find(
              (r) =>
                r.receiverId === currentUser.id &&
                r.status === 'pending' &&
                Date.now() - r.createdAt < 15000
            );
            if (freshPending && freshPending.id !== incomingFriendRequestNotif?.id) {
              setIncomingFriendRequestNotif(freshPending);
              sounds.playHeartChime();
            }
          }
        },
        (err) => {
          console.warn('Firestore friend requests note:', err.message);
        }
      );
      return () => unsubscribe();
    } catch (e) {
      console.warn('Firestore friend requests listener error:', e);
    }
  }, [currentUser.id]);

  // Seed demo items and starter friend request if list is empty
  useEffect(() => {
    if (throwsList.length === 0) {
      const demoItems: ThrowItem[] = [
        {
          id: 'demo-1',
          senderId: 'maya',
          senderName: 'Maya',
          senderAvatar: DEFAULT_FRIENDS[0].avatar,
          senderCity: 'Chennai',
          senderLat: 13.0827,
          senderLng: 80.2707,
          receiverId: currentUser.id,
          receiverName: currentUser.name,
          receiverAvatar: currentUser.avatar,
          receiverCity: currentUser.city,
          receiverLat: currentUser.lat,
          receiverLng: currentUser.lng,
          objectType: 'letter',
          content:
            "thank you so much !!\nthis means the world to me.\nmore than words can say.\ngetting your letter today brought\nsuch a warm smile to my face.\nin a busy week, holding your words\nfelt like the sweetest comfort.\nthank you for always being there,\nand loving me so thoughtfully.\nit means so much to have you.\nwith all my love,\nmaya.",
          status: 'delivered',
          distanceMiles: 2422,
          createdAt: Date.now() - 3600000 * 2,
          departure_time: Date.now() - 3600000 * 24,
          scheduled_arrival: Date.now() - 3600000 * 2,
          trackingNumber: 'MAYA-DEL-2422'
        },
        {
          id: 'demo-2',
          senderId: 'saara',
          senderName: 'Saara',
          senderAvatar: DEFAULT_FRIENDS[3].avatar,
          senderCity: 'Sydney, Australia',
          senderLat: -33.8688,
          senderLng: 151.2093,
          receiverId: currentUser.id,
          receiverName: currentUser.name,
          receiverAvatar: currentUser.avatar,
          receiverCity: currentUser.city,
          receiverLat: currentUser.lat,
          receiverLng: currentUser.lng,
          objectType: 'popper',
          content: 'Woohoo!! 🎉 Cheering for your new launch! Sending high vibrations!',
          status: 'delivered',
          distanceMiles: 5103,
          createdAt: Date.now() - 3600000 * 8,
          departure_time: Date.now() - 3600000 * 48,
          scheduled_arrival: Date.now() - 3600000 * 8,
          trackingNumber: 'SAAR-AIR-5103'
        },
        {
          id: 'demo-3',
          senderId: 'elaya',
          senderName: 'Elaya',
          senderAvatar: DEFAULT_FRIENDS[1].avatar,
          senderCity: 'San Francisco, USA',
          senderLat: 37.7749,
          senderLng: -122.4194,
          receiverId: currentUser.id,
          receiverName: currentUser.name,
          receiverAvatar: currentUser.avatar,
          receiverCity: currentUser.city,
          receiverLat: currentUser.lat,
          receiverLng: currentUser.lng,
          objectType: 'grenade',
          content: 'BOOM! 💥 No safe zones between friends. You owe me lunch now!',
          status: 'delivered',
          distanceMiles: 8710,
          createdAt: Date.now() - 3600000 * 12,
          departure_time: Date.now() - 3600000 * 72,
          scheduled_arrival: Date.now() - 3600000 * 12,
          trackingNumber: 'ELAY-PAC-8710'
        }
      ];
      setThrowsList(demoItems);
    }

    // Seed a starter incoming friend request if none exist
    if (friendRequests.length === 0) {
      setFriendRequests([
        {
          id: 'req-demo-chloe',
          senderId: 'chloe',
          senderUsername: 'chloe_paris',
          senderAvatar:
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
          senderCity: 'Paris, France',
          receiverId: currentUser.id,
          receiverUsername: currentUser.username || currentUser.name.toLowerCase(),
          status: 'pending',
          createdAt: Date.now() - 3600000 * 5
        }
      ]);
    }
  }, [currentUser]);

  // Handle switching active profile (simulation between Harin, Maya, Saara, etc.)
  const handleSwitchProfile = (newProfile: UserProfile) => {
    setCurrentUser(newProfile);
    const all = [CURRENT_USER_DEFAULT, ...DEFAULT_FRIENDS];
    const newFriends = all.filter((p) => p.id !== newProfile.id);
    setFriends(newFriends);
    setSelectedFriend(newFriends[0]);
    setIsSettingsOpen(false);
  };

  // Toggle Sound & Mute
  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    sounds.setMuted(nextMute);
    if (!nextMute) {
      sounds.playSnap();
    }
  };

  // Friend Request Actions
  const handleSendFriendRequest = async (targetUser: UserProfile) => {
    const newRequest: FriendRequest = {
      id: `freq-${Date.now()}`,
      senderId: currentUser.id,
      senderUsername: currentUser.username || currentUser.name.toLowerCase().replace(/\s+/g, '_'),
      senderAvatar: currentUser.avatar,
      senderCity: currentUser.city,
      receiverId: targetUser.id,
      receiverUsername: targetUser.username || targetUser.name.toLowerCase().replace(/\s+/g, '_'),
      status: 'pending',
      createdAt: Date.now()
    };

    setFriendRequests((prev) => [newRequest, ...prev]);

    try {
      await addDoc(collection(db, 'friend_requests'), newRequest);
    } catch (e) {
      console.warn('Friend request write note:', e);
    }
  };

  const handleAcceptFriendRequest = async (request: FriendRequest) => {
    // 1. Mark request accepted locally
    setFriendRequests((prev) =>
      prev.map((r) => (r.id === request.id ? { ...r, status: 'accepted' } : r))
    );
    if (incomingFriendRequestNotif?.id === request.id) {
      setIncomingFriendRequestNotif(null);
    }

    // 2. Find sender user profile
    const foundUser =
      ALL_DIRECTORY_USERS.find((u) => u.id === request.senderId) || {
        id: request.senderId,
        name: request.senderUsername.replace(/_/g, ' '),
        username: request.senderUsername,
        city: request.senderCity,
        country: 'World',
        avatar: request.senderAvatar,
        lat: 48.8566,
        lng: 2.3522,
        bio: 'Connected via Throw 💫'
      };

    // 3. Add to friends list if not already present
    if (!friends.some((f) => f.id === foundUser.id)) {
      setFriends((prev) => [foundUser, ...prev]);
      setSelectedFriend(foundUser);
    }

    // 4. Update current user's friendIds
    setCurrentUser((prev) => ({
      ...prev,
      friendIds: [...(prev.friendIds || []), foundUser.id]
    }));

    // 5. Celebration effects
    sounds.playPartyPopper();
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    // 6. Sync to Firestore
    try {
      if (request.id.startsWith('req-demo-')) return;
      const docRef = doc(db, 'friend_requests', request.id);
      await updateDoc(docRef, { status: 'accepted' });
    } catch (e) {
      console.warn('Accept friend request update note:', e);
    }
  };

  const handleDeclineFriendRequest = async (request: FriendRequest) => {
    setFriendRequests((prev) =>
      prev.map((r) => (r.id === request.id ? { ...r, status: 'declined' } : r))
    );
    if (incomingFriendRequestNotif?.id === request.id) {
      setIncomingFriendRequestNotif(null);
    }

    try {
      if (request.id.startsWith('req-demo-')) return;
      const docRef = doc(db, 'friend_requests', request.id);
      await updateDoc(docRef, { status: 'declined' });
    } catch (e) {
      console.warn('Decline friend request update note:', e);
    }
  };

  // 1. Initiate throw: Opens Boarding Pass / Courier Waybill for review & perforation tear
  const handleInitiateThrow = (content: string = '') => {
    setIsComposerOpen(false);

    const distance = calculateDistanceMiles(
      currentUser.lat,
      currentUser.lng,
      selectedFriend.lat,
      selectedFriend.lng
    );

    const defaultContents: Record<ObjectType, string> = {
      letter: 'A handwritten letter carried across the wind to you ✨',
      grenade: "BOOM! You've been pranked with a virtual grenade! 💥",
      heart: 'Sending you warm love and big smiles today! ❤️',
      gift: 'A special surprise gift box wrapped just for you! 🎁✨',
      popper: 'Pop! Cheering you on and celebrating our friendship! 🎉',
      confetti_bomb: 'KABOOM! Confetti bomb party blast incoming! 🎊💥'
    };

    setPendingDispatch({
      recipient: selectedFriend,
      objectType: equippedObject,
      content: content || defaultContents[equippedObject] || 'A spatial gift sent to you ✨',
      distanceMiles: distance
    });
  };

  // 2. THE THROW MECHANIC: Triggered when Boarding Pass stub is torn
  const executeThrow = async (dispatchData: Partial<ThrowItem>) => {
    setPendingDispatch(null);
    setIsFlying(true);
    setFlightProgress(0);

    const distance = dispatchData.distanceMiles || calculateDistanceMiles(
      currentUser.lat,
      currentUser.lng,
      selectedFriend.lat,
      selectedFriend.lng
    );
    setDisplayedDistance(distance);

    const objectNamesMap: Record<ObjectType, string> = {
      letter: 'letter',
      grenade: 'grenade',
      heart: 'heart',
      gift: 'gift box',
      popper: 'party popper',
      confetti_bomb: 'confetti bomb'
    };

    setFlightStatusText(
      `dispatching ${objectNamesMap[equippedObject] || 'object'} to ${selectedFriend.name.toLowerCase()}...`
    );

    // Audio cue on throw start
    if (equippedObject === 'grenade' || equippedObject === 'confetti_bomb') {
      sounds.playGrenadeArm();
    } else {
      sounds.playWhoosh();
    }

    const departure = dispatchData.departure_time || Date.now();
    const arrival = dispatchData.scheduled_arrival || (departure + 15000);

    const newThrow: ThrowItem = {
      id: `throw-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      senderCity: currentUser.city,
      senderLat: currentUser.lat,
      senderLng: currentUser.lng,
      receiverId: selectedFriend.id,
      receiverName: selectedFriend.name,
      receiverAvatar: selectedFriend.avatar,
      receiverCity: selectedFriend.city,
      receiverLat: selectedFriend.lat,
      receiverLng: selectedFriend.lng,
      objectType: equippedObject,
      content: dispatchData.content || 'A spatial courier dispatch ✨',
      status: 'in_flight',
      distanceMiles: distance,
      createdAt: departure,
      departure_time: departure,
      scheduled_arrival: arrival,
      trackingNumber: dispatchData.trackingNumber,
      isFastTravel: dispatchData.isFastTravel ?? isFastTravel
    };

    setCurrentFlightItem(newThrow);

    // Save to Firestore
    try {
      await addDoc(collection(db, 'throws'), {
        ...newThrow,
        status: 'in_transit'
      });
    } catch (e) {
      console.warn('Firestore write warning:', e);
    }

    // Add to local state immediately
    setThrowsList((prev) => [newThrow, ...prev]);

    // Update inventory pill count
    setInventory((prev) => ({
      ...prev,
      letters: equippedObject === 'letter' ? prev.letters + 1 : prev.letters,
      grenades: equippedObject === 'grenade' ? prev.grenades + 1 : prev.grenades,
      love: equippedObject === 'heart' ? prev.love + 1 : prev.love,
      gifts: equippedObject === 'gift' ? prev.gifts + 1 : prev.gifts,
      poppers: equippedObject === 'popper' ? prev.poppers + 1 : prev.poppers,
      confettiBombs: equippedObject === 'confetti_bomb' ? prev.confettiBombs + 1 : prev.confettiBombs
    }));

    // Start 3D parabolic camera flight animation
    const flightDuration = 3200;
    const startTime = performance.now();

    const animateFlight = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / flightDuration);
      setFlightProgress(progress);

      // Countdown distance smoothly as projectile approaches
      const remainingMiles = Math.round(distance * (1 - progress));
      setDisplayedDistance(remainingMiles);

      if (progress < 1) {
        flightAnimRef.current = requestAnimationFrame(animateFlight);
      } else {
        // FLIGHT DISPATCHED INTO ORBIT / TRANSIT
        setFlightStatusText(`dispatched to ${selectedFriend.name.toLowerCase()}`);
        setDisplayedDistance(0);

        if (equippedObject === 'grenade') {
          sounds.playExplosion();
        } else if (equippedObject === 'gift') {
          sounds.playGiftOpen();
        } else if (equippedObject === 'popper') {
          sounds.playPartyPopper();
        } else if (equippedObject === 'confetti_bomb') {
          sounds.playConfettiBomb();
        } else if (equippedObject === 'heart') {
          sounds.playHeartChime();
        } else {
          sounds.playLetterOpen();
        }

        // Show dispatch transition for 2.2 seconds before returning
        setTimeout(() => {
          setIsFlying(false);
          setCurrentFlightItem(null);
          setFlightProgress(0);

          // SENDER CONFIRMATION TOAST (Sender only receives confirmation of dispatch; NOT incoming notification!)
          const etaInfo = formatETA(newThrow.scheduled_arrival);
          setSenderConfirmationToast({
            message: 'Dispatch Confirmed',
            tracking: newThrow.trackingNumber || 'AIR-WAYBILL',
            receiverName: selectedFriend.name,
            etaText: etaInfo.text
          });
        }, 2200);
      }
    };

    flightAnimRef.current = requestAnimationFrame(animateFlight);
  };

  const handleReply = (recipientId: string, replyType: ObjectType) => {
    setActiveImpactThrow(null);
    const friend = friends.find((f) => f.id === recipientId);
    if (friend) {
      setSelectedFriend(friend);
    }
    setEquippedObject(replyType);
    if (replyType === 'letter') {
      setIsComposerOpen(true);
    }
  };

  // Filter throws for current user
  const receivedThrows = throwsList.filter((t) => t.receiverId === currentUser.id);
  const sentThrows = throwsList.filter((t) => t.senderId === currentUser.id);

  // Filter pending friend requests
  const pendingReceivedRequests = friendRequests.filter(
    (r) => r.receiverId === currentUser.id && r.status === 'pending'
  );
  const pendingSentRequests = friendRequests.filter(
    (r) => r.senderId === currentUser.id && r.status === 'pending'
  );

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-900 font-sans select-none">
      {/* 1. BACKGROUND 3D MAP CANVAS */}
      <MapCanvas
        currentLocation={{ lat: currentUser.lat, lng: currentUser.lng }}
        targetFriend={isFlying ? selectedFriend : selectedFriend}
        isFlying={isFlying}
        flightProgress={flightProgress}
        isInboxMode={false}
        userProfile={currentUser}
        friends={friends}
        onSelectFriend={(friend) => {
          if (!isFlying) {
            sounds.playSnap();
            setSelectedFriend(friend);
          }
        }}
      />

      {/* 2. DRAFTING GRID OVERLAY (shown in idle drafting mode) */}
      {!isFlying && (
        <div className="absolute inset-0 bg-grid-pattern pointer-events-none opacity-60 transition-opacity" />
      )}

      {/* 3. DYNAMIC ISLAND NOTIFICATION FOR FRIEND REQUEST */}
      {incomingFriendRequestNotif && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-scale-up max-w-[92vw] sm:max-w-md w-full px-2">
          <div className="flex items-center justify-between p-2.5 sm:p-3 bg-indigo-950/95 text-white rounded-full shadow-2xl border border-indigo-400/30 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <img
                src={incomingFriendRequestNotif.senderAvatar}
                alt={incomingFriendRequestNotif.senderUsername}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-400"
              />
              <div className="text-left">
                <p className="text-xs font-bold leading-tight">
                  👋 @{incomingFriendRequestNotif.senderUsername} sent a friend request!
                </p>
                <p className="text-[11px] text-indigo-200">
                  {incomingFriendRequestNotif.senderCity}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mr-1">
              <button
                onClick={() => handleAcceptFriendRequest(incomingFriendRequestNotif)}
                className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-full transition-colors"
              >
                Accept
              </button>
              <button
                onClick={() => {
                  sounds.playSnap();
                  setIsFriendRequestsOpen(true);
                  setIncomingFriendRequestNotif(null);
                }}
                className="px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-full transition-colors"
              >
                Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. DYNAMIC ISLAND NOTIFICATION FOR INCOMING THROW */}
      {incomingNotification && !incomingFriendRequestNotif && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-scale-up max-w-[92vw] sm:max-w-md w-full px-2">
          <div
            onClick={() => {
              sounds.playSnap();
              setActiveImpactThrow(incomingNotification);
              setIncomingNotification(null);
            }}
            className="flex items-center justify-between p-2.5 sm:p-3 bg-black/90 text-white rounded-full shadow-2xl border border-white/20 backdrop-blur-xl cursor-pointer hover:bg-black transition-all"
          >
            <div className="flex items-center gap-3">
              <img
                src={incomingNotification.senderAvatar}
                alt={incomingNotification.senderName}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-500"
              />
              <div className="text-left">
                <p className="text-xs font-bold leading-tight">
                  You have received an item from {incomingNotification.senderName}
                </p>
                <p className="text-[11px] text-slate-300">
                  {incomingNotification.objectType === 'grenade'
                    ? '💣 Incoming prank grenade!'
                    : incomingNotification.objectType === 'gift'
                    ? '🎁 Surprise gift box arrived!'
                    : incomingNotification.objectType === 'popper'
                    ? '🎉 Incoming party popper!'
                    : incomingNotification.objectType === 'confetti_bomb'
                    ? '🎊 Confetti bomb detonating!'
                    : incomingNotification.objectType === 'heart'
                    ? '❤️ Incoming love!'
                    : '✈️ Handwritten letter arrived!'}
                </p>
              </div>
            </div>
            <button className="px-3 py-1 bg-white text-black text-xs font-bold rounded-full hover:bg-slate-200 transition-colors mr-1">
              Open
            </button>
          </div>
        </div>
      )}

      {/* 4.1 SENDER DISPATCH CONFIRMATION TOAST */}
      {senderConfirmationToast && !incomingNotification && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-scale-up max-w-[94vw] sm:max-w-md w-full px-2">
          <div className="flex items-center justify-between p-2.5 sm:p-3 bg-slate-900/95 text-white rounded-2xl shadow-2xl border border-emerald-500/40 backdrop-blur-xl">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 size={16} />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{senderConfirmationToast.message}</span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded">
                    #{senderConfirmationToast.tracking}
                  </span>
                </p>
                <p className="text-[11px] text-slate-300 flex items-center gap-1">
                  <Plane size={11} className="text-indigo-400" />
                  <span>En route to {senderConfirmationToast.receiverName} • ETA: {senderConfirmationToast.etaText}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => {
                  sounds.playSnap();
                  setInboxInitialTab('sent');
                  setIsInboxModalOpen(true);
                  setSenderConfirmationToast(null);
                }}
                className="px-2.5 py-1 bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold rounded-lg transition-colors"
              >
                Track
              </button>
              <button
                onClick={() => setSenderConfirmationToast(null)}
                className="p-1 text-slate-400 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4.2 COURIER IN-TRANSIT NOTICE FOR RECEIVER */}
      {courierTransitBanner && !incomingNotification && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-scale-up max-w-[94vw] sm:max-w-md w-full px-2">
          <div
            onClick={() => {
              sounds.playSnap();
              setInboxInitialTab('transit');
              setIsInboxModalOpen(true);
              setCourierTransitBanner(null);
            }}
            className="flex items-center justify-between p-2.5 sm:p-3 bg-indigo-950/90 text-white rounded-2xl shadow-2xl border border-indigo-500/40 backdrop-blur-xl cursor-pointer hover:bg-indigo-900 transition-all"
          >
            <div className="flex items-center gap-2.5">
              <img
                src={courierTransitBanner.senderAvatar}
                alt={courierTransitBanner.senderName}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-indigo-400"
              />
              <div className="text-left">
                <p className="text-xs font-bold text-white flex items-center gap-1">
                  <span>📦 Parcel en route from {courierTransitBanner.senderName}</span>
                </p>
                <p className="text-[11px] text-indigo-200 flex items-center gap-1">
                  <Clock size={11} className="text-amber-300" />
                  <span>ETA: {formatETA(courierTransitBanner.scheduled_arrival).text}</span>
                </p>
              </div>
            </div>
            <button className="px-2.5 py-1 bg-indigo-500 text-white text-[11px] font-bold rounded-lg hover:bg-indigo-400 transition-colors">
              Track
            </button>
          </div>
        </div>
      )}

      {/* 5. TOP APP BAR */}
      {!isFlying && (
        <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-5 pt-4 pb-2">
          {/* Logo */}
          <div className="flex items-center gap-1.5">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 drop-shadow-xs">
              throw
            </h1>
            <span className="w-2 h-2 rounded-full bg-indigo-600 mb-2" />
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2">
            {/* Find Friends Button with Badge */}
            <button
              onClick={() => {
                sounds.playSnap();
                setIsFriendRequestsOpen(true);
              }}
              title="Find & Add Friends"
              className="relative p-2.5 rounded-full bg-white/85 hover:bg-white text-slate-800 backdrop-blur-xl shadow-md border border-white/80 transition-all active:scale-95"
            >
              <UserPlus size={18} />
              {pendingReceivedRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                  {pendingReceivedRequests.length}
                </span>
              )}
            </button>

            {/* Inbox Button */}
            <button
              onClick={() => {
                sounds.playSnap();
                setIsInboxModalOpen(true);
              }}
              title="Inbox"
              className="relative p-2.5 rounded-full bg-white/85 hover:bg-white text-slate-800 backdrop-blur-xl shadow-md border border-white/80 transition-all active:scale-95"
            >
              <InboxIcon size={18} />
              {receivedThrows.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                  {receivedThrows.length}
                </span>
              )}
            </button>

            {/* Sound Toggle */}
            <button
              onClick={handleToggleMute}
              title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
              className="p-2.5 rounded-full bg-white/85 hover:bg-white text-slate-800 backdrop-blur-xl shadow-md border border-white/80 transition-all active:scale-95"
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>

            {/* Settings Cog */}
            <button
              onClick={() => {
                sounds.playSnap();
                setIsSettingsOpen(true);
              }}
              title="Settings & Switch User"
              className="p-2.5 rounded-full bg-white/85 hover:bg-white text-slate-800 backdrop-blur-xl shadow-md border border-white/80 transition-all active:scale-95"
            >
              <Settings size={18} />
            </button>
          </div>
        </header>
      )}

      {/* 6. FRIEND CAROUSEL */}
      {!isFlying && !isComposerOpen && (
        <div className="absolute top-14 left-0 right-0 z-20">
          <FriendCarousel
            friends={friends}
            selectedFriend={selectedFriend}
            onSelectFriend={(f) => setSelectedFriend(f)}
          />
        </div>
      )}

      {/* 7. CENTER INTERACTIVE CANVAS / VIRTUAL OBJECT */}
      {!isFlying && !isComposerOpen && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 pt-16">
          <div
            onClick={() => {
              if (equippedObject === 'letter') {
                sounds.playSnap();
                setIsComposerOpen(true);
              } else {
                setIsObjectSelectorOpen(true);
              }
            }}
            className="pointer-events-auto cursor-pointer group transition-transform duration-300 hover:scale-105 active:scale-95"
          >
            <VirtualObject type={equippedObject} size={170} />
          </div>

          {/* Action Call to Action below object */}
          <div className="pointer-events-auto mt-6 flex flex-col items-center gap-2">
            {equippedObject === 'letter' ? (
              <button
                onClick={() => {
                  sounds.playSnap();
                  setIsComposerOpen(true);
                }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/90 hover:bg-white text-slate-900 font-semibold text-sm shadow-xl backdrop-blur-xl border border-white/90 transition-all active:scale-95"
              >
                <span>Write note for {selectedFriend.name}</span>
              </button>
            ) : (
              <button
                onClick={() => handleInitiateThrow()}
                className="flex items-center gap-2 px-7 py-3 rounded-full bg-slate-900 hover:bg-black text-white font-bold text-sm shadow-2xl transition-all active:scale-95"
              >
                <span>
                  Throw{' '}
                  {equippedObject === 'grenade'
                    ? '💣 Grenade'
                    : equippedObject === 'heart'
                    ? '❤️ Heart'
                    : equippedObject === 'gift'
                    ? '🎁 Gift Box'
                    : equippedObject === 'popper'
                    ? '🎉 Party Popper'
                    : equippedObject === 'confetti_bomb'
                    ? '🎊 Confetti Bomb'
                    : 'Item'}
                </span>
                <Send size={15} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 8. LETTER COMPOSER MODAL (When writing a letter) */}
      {isComposerOpen && !isFlying && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4">
          <LetterComposer
            recipient={selectedFriend}
            initialMessage={composerInitialText}
            onSend={(msg) => handleInitiateThrow(msg)}
            onClose={() => setIsComposerOpen(false)}
          />
        </div>
      )}

      {/* 8.5 REALISTIC COURIER BOARDING PASS / DISPATCH OVERLAY */}
      {pendingDispatch && !isFlying && (
        <BoardingPass
          sender={currentUser}
          recipient={pendingDispatch.recipient}
          objectType={pendingDispatch.objectType}
          content={pendingDispatch.content}
          distanceMiles={pendingDispatch.distanceMiles}
          isFastTravel={isFastTravel}
          onConfirmDispatch={(throwPayload) => {
            executeThrow(throwPayload);
          }}
          onCancel={() => setPendingDispatch(null)}
        />
      )}

      {/* 9. CINEMATIC FLIGHT & TRANSIT VIEW (During Throw) */}
      {isFlying && (
        <div className="absolute inset-0 z-30 flex flex-col justify-between p-6 pointer-events-none">
          {/* Top Flight Header */}
          <div className="flex flex-col items-center pt-8 text-center animate-scale-up">
            <div className="w-14 h-14 rounded-full p-0.5 bg-white shadow-xl ring-4 ring-indigo-500/70 mb-2">
              <img
                src={selectedFriend.avatar}
                alt={selectedFriend.name}
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <h2 className="text-xl font-black text-slate-900 drop-shadow-md">
              {flightStatusText}
            </h2>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-xs font-semibold text-slate-700 shadow-md mt-1">
              <Navigation size={12} className="text-indigo-600 animate-spin" />
              <span>
                {selectedFriend.city.toLowerCase()} • {displayedDistance} mi away
              </span>
            </div>
          </div>

          {/* Flying Projectile in Mid-Air */}
          <div
            className="flex items-center justify-center transition-transform"
            style={{
              transform: `scale(${1 + Math.sin(flightProgress * Math.PI) * 0.4}) translateY(${
                -Math.sin(flightProgress * Math.PI) * 60
              }px)`
            }}
          >
            <VirtualObject type={equippedObject} size={150} />
          </div>

          {/* Flight Footer */}
          <div className="text-center pb-8">
            <span className="text-xs font-bold text-slate-700 bg-white/85 px-4 py-1.5 rounded-full backdrop-blur-md shadow-sm">
              Navigating 3D Great Circle Trajectory
            </span>
          </div>
        </div>
      )}

      {/* 10. BOTTOM INVENTORY STATS PILL (video: items + new objects) */}
      {!isFlying && !isComposerOpen && (
        <footer className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 max-w-[95vw]">
          <div
            onClick={() => {
              sounds.playSnap();
              setIsObjectSelectorOpen(true);
            }}
            className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-2.5 bg-white/85 hover:bg-white/95 text-slate-800 rounded-full shadow-[0_10px_35px_rgba(0,0,0,0.12)] border border-white/80 backdrop-blur-2xl cursor-pointer transition-all active:scale-95 overflow-x-auto no-scrollbar"
          >
            <div className="flex items-center gap-1 text-xs font-bold whitespace-nowrap">
              <span>✈️</span>
              <span>{inventory.letters}</span>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold whitespace-nowrap">
              <span>💣</span>
              <span>{inventory.grenades}</span>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold whitespace-nowrap">
              <span>❤️</span>
              <span>{inventory.love}</span>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold whitespace-nowrap">
              <span>🎁</span>
              <span>{inventory.gifts}</span>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold whitespace-nowrap">
              <span>🎉</span>
              <span>{inventory.poppers}</span>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold whitespace-nowrap">
              <span>🎊</span>
              <span>{inventory.confettiBombs}</span>
            </div>
            <span className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-wider pl-1 border-l border-slate-200 whitespace-nowrap">
              Equip
            </span>
          </div>
        </footer>
      )}

      {/* 11. OBJECT SELECTOR POPOVER */}
      <ObjectSelector
        currentObject={equippedObject}
        onSelectObject={(obj) => setEquippedObject(obj)}
        isOpen={isObjectSelectorOpen}
        onClose={() => setIsObjectSelectorOpen(false)}
      />

      {/* 12. FRIEND REQUESTS & DIRECTORY MODAL */}
      <FriendRequestsModal
        isOpen={isFriendRequestsOpen}
        onClose={() => setIsFriendRequestsOpen(false)}
        currentUser={currentUser}
        friends={friends}
        pendingReceivedRequests={pendingReceivedRequests}
        pendingSentRequests={pendingSentRequests}
        onSendRequest={handleSendFriendRequest}
        onAcceptRequest={handleAcceptFriendRequest}
        onDeclineRequest={handleDeclineFriendRequest}
      />

      {/* 13. INBOX MODAL */}
      <InboxModal
        isOpen={isInboxModalOpen}
        onClose={() => setIsInboxModalOpen(false)}
        receivedThrows={receivedThrows}
        sentThrows={sentThrows}
        initialTab={inboxInitialTab}
        onOpenThrow={(item) => {
          setActiveImpactThrow(item);
        }}
        onClearHistory={() => setThrowsList([])}
      />

      {/* 14. IMPACT OVERLAY (The grenade explosion, gift untying, or popper burst) */}
      {activeImpactThrow && (
        <ImpactOverlay
          throwItem={activeImpactThrow}
          onClose={() => setActiveImpactThrow(null)}
          onReply={handleReply}
        />
      )}

      {/* 15. SETTINGS & PROFILE SWITCHER MODAL */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentUser={currentUser}
        availableProfiles={[CURRENT_USER_DEFAULT, ...DEFAULT_FRIENDS]}
        onSwitchProfile={handleSwitchProfile}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        isFastTravel={isFastTravel}
        onToggleFastTravel={() => {
          const next = !isFastTravel;
          setIsFastTravel(next);
          localStorage.setItem('throw_fast_travel', String(next));
        }}
        authUser={authUser}
      />
    </div>
  );
}
