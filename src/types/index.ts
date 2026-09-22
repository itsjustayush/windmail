export type ObjectType = 'letter' | 'grenade' | 'heart' | 'gift' | 'popper' | 'confetti_bomb';

export interface UserProfile {
  id: string;
  name: string;
  username?: string;
  city: string;
  country?: string;
  avatar: string;
  lat: number;
  lng: number;
  bio?: string;
  friendIds?: string[];
}

export interface FriendRequest {
  id: string;
  senderId: string;
  senderUsername: string;
  senderAvatar: string;
  senderCity: string;
  senderLat?: number;
  senderLng?: number;
  receiverId: string;
  receiverUsername: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: number;
}

export interface ThrowItem {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderCity: string;
  senderLat: number;
  senderLng: number;
  receiverId: string;
  receiverName: string;
  receiverAvatar: string;
  receiverCity: string;
  receiverLat: number;
  receiverLng: number;
  objectType: ObjectType;
  content: string; // letter text or audio note transcription / prank line
  audioDuration?: number;
  status: 'in_flight' | 'in_transit' | 'delivered' | 'opened';
  distanceMiles: number;
  createdAt: number;
  departure_time?: number;
  scheduled_arrival?: number;
  trackingNumber?: string;
  isFastTravel?: boolean;
}

export interface InventoryStats {
  letters: number;
  grenades: number;
  love: number;
  gifts: number;
  poppers: number;
  confettiBombs: number;
}
