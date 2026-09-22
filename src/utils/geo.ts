import { UserProfile } from '../types';

/**
 * Calculates the great-circle distance between two points in statute miles
 * using the Haversine formula
 */
export function calculateDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export const ALL_DIRECTORY_USERS: UserProfile[] = [
  {
    id: 'maya',
    name: 'Maya',
    username: 'maya',
    city: 'Chennai',
    country: 'India',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    lat: 13.0827,
    lng: 80.2707,
    bio: 'Tea lover & daydreamer ☕'
  },
  {
    id: 'elaya',
    name: 'Elaya',
    username: 'elaya',
    city: 'California',
    country: 'USA',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    lat: 37.7749,
    lng: -122.4194,
    bio: 'Building things under the sun ☀️'
  },
  {
    id: 'kreethika',
    name: 'Kreethika',
    username: 'kreethika',
    city: 'Bangalore',
    country: 'India',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    lat: 12.9716,
    lng: 77.5946,
    bio: 'Music & code & late walks 🌙'
  },
  {
    id: 'saara',
    name: 'Saara',
    username: 'saara',
    city: 'Australia',
    country: 'Sydney',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
    lat: -33.8688,
    lng: 151.2093,
    bio: 'Ocean breeze & golden hours 🌊'
  },
  {
    id: 'alex',
    name: 'Alex',
    username: 'alex',
    city: 'Tokyo',
    country: 'Japan',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    lat: 35.6762,
    lng: 139.6503,
    bio: 'Night photography & ramen 🍜'
  },
  {
    id: 'liam',
    name: 'Liam',
    username: 'liam_london',
    city: 'London',
    country: 'UK',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    lat: 51.5074,
    lng: -0.1278,
    bio: 'Vinyl records & foggy mornings ☕'
  },
  {
    id: 'chloe',
    name: 'Chloe',
    username: 'chloe_paris',
    city: 'Paris',
    country: 'France',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    lat: 48.8566,
    lng: 2.3522,
    bio: 'Art museums & fresh baguettes 🥐'
  },
  {
    id: 'kenji',
    name: 'Kenji',
    username: 'kenji_kyoto',
    city: 'Kyoto',
    country: 'Japan',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
    lat: 35.0116,
    lng: 135.7681,
    bio: 'Zen gardens & matcha 🍵'
  },
  {
    id: 'priya',
    name: 'Priya',
    username: 'priya_mumbai',
    city: 'Mumbai',
    country: 'India',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    lat: 19.076,
    lng: 72.8777,
    bio: 'Cinema, monsoon chai & waves 🌊'
  }
];

export const DEFAULT_FRIENDS: UserProfile[] = ALL_DIRECTORY_USERS.slice(0, 5);

export const CURRENT_USER_DEFAULT: UserProfile = {
  id: 'harin',
  name: 'Harin',
  username: 'harin',
  city: 'Indiranagar, Bangalore',
  country: 'India',
  avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
  lat: 12.9784,
  lng: 77.6408,
  bio: 'Living in the moment 📍',
  friendIds: ['maya', 'elaya', 'kreethika', 'saara', 'alex']
};
