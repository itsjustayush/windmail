/**
 * Realistic Physical Mail & Courier Transit Calculation Engine
 * 
 * Rules:
 * - Local/In-country (under 500 miles): 12 to 24 hours delay.
 * - Continental (500 - 2500 miles): 2 to 3 days delay (48 to 72 hours).
 * - Overseas/Global (2500+ miles): 4 to 7 days delay (96 to 168 hours).
 * 
 * Fast Travel Override:
 * - Divides delay by 10,000 so couriers arrive in seconds instead of days.
 */

export function calculateDeliveryTime(distanceInMiles: number, isFastTravel: boolean = false): {
  delayMs: number;
  delayHours: number;
  classification: string;
  category: 'local' | 'continental' | 'overseas';
} {
  let delayHours = 24;
  let classification = 'In-Country / Local Express';
  let category: 'local' | 'continental' | 'overseas' = 'local';

  if (distanceInMiles < 500) {
    // 12 to 24 hours scaled by distance
    const ratio = Math.max(0, distanceInMiles) / 500;
    delayHours = 12 + ratio * 12;
    classification = 'Local Postal Route (< 500 mi)';
    category = 'local';
  } else if (distanceInMiles <= 2500) {
    // 2 to 3 days (48 to 72 hours)
    const ratio = (distanceInMiles - 500) / 2000;
    delayHours = 48 + ratio * 24;
    classification = 'Continental Overland / Air Mail (500-2,500 mi)';
    category = 'continental';
  } else {
    // 4 to 7 days (96 to 168 hours)
    const ratio = Math.min(distanceInMiles - 2500, 7500) / 7500;
    delayHours = 96 + ratio * 72;
    classification = 'Transcontinental Overseas Courier (2,500+ mi)';
    category = 'overseas';
  }

  let delayMs = delayHours * 60 * 60 * 1000;

  if (isFastTravel) {
    // Fast travel: divide by 10,000 (e.g. 18 hours = 64,800s / 10000 = 6.48s)
    // Minimum 10 seconds for user to test and observe in-transit state
    delayMs = Math.max(10000, Math.round(delayMs / 10000));
  }

  return {
    delayMs: Math.round(delayMs),
    delayHours: Math.round(delayHours * 10) / 10,
    classification,
    category
  };
}

export function generateTrackingNumber(prefix: string = 'THW'): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 7; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${code.slice(0, 4)}-${code.slice(4)}`;
}

export function formatETA(scheduledArrival?: number, now: number = Date.now()): {
  text: string;
  isDelivered: boolean;
  progressPercent: number;
  remainingMs: number;
} {
  if (!scheduledArrival) {
    return {
      text: 'Arrived at Destination',
      isDelivered: true,
      progressPercent: 100,
      remainingMs: 0
    };
  }
  const diff = scheduledArrival - now;
  if (diff <= 0) {
    return {
      text: 'Arrived at Destination',
      isDelivered: true,
      progressPercent: 100,
      remainingMs: 0
    };
  }

  const seconds = Math.floor(diff / 1000) % 60;
  const minutes = Math.floor(diff / (1000 * 60)) % 60;
  const hours = Math.floor(diff / (1000 * 60 * 60)) % 24;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  let text = '';
  if (days > 0) {
    text = `${days}d ${hours}h remaining`;
  } else if (hours > 0) {
    text = `${hours}h ${minutes}m remaining`;
  } else if (minutes > 0) {
    text = `${minutes}m ${seconds}s remaining`;
  } else {
    text = `${seconds}s remaining`;
  }

  return {
    text,
    isDelivered: false,
    progressPercent: 0,
    remainingMs: diff
  };
}

export function formatCourierDate(timestamp?: number): string {
  if (!timestamp) return 'Dispatched';
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}
