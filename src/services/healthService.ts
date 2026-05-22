export interface HealthDayData {
  day: string;
  avgHeartRate: number;
  avgHRV: number; // in ms
}

export interface HealthIntegrationState {
  isConnected: boolean;
  provider: "Apple Health" | "Fitbit" | "Garmin" | null;
  lastSynced: string | null;
}

// Simulated 7-day historical health data representing baseline resting states
const HISTORICAL_HEALTH_DATA: HealthDayData[] = [
  { day: "Mon", avgHeartRate: 72, avgHRV: 45 },
  { day: "Tue", avgHeartRate: 74, avgHRV: 42 },
  { day: "Wed", avgHeartRate: 70, avgHRV: 48 },
  { day: "Thu", avgHeartRate: 69, avgHRV: 52 },
  { day: "Fri", avgHeartRate: 73, avgHRV: 44 },
  { day: "Sat", avgHeartRate: 67, avgHRV: 56 },
  { day: "Sun", avgHeartRate: 65, avgHRV: 62 },
];

export async function fetchHistoricalHealthData(): Promise<HealthDayData[]> {
  // Simulate network latency for genuine feel
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(HISTORICAL_HEALTH_DATA);
    }, 600);
  });
}

/**
 * Calculates current simulated BPM and HRV based on active breathing phase and time progress.
 * Demonstrates Respiratory Sinus Arrhythmia (RSA):
 * - Inhale: Heart rate rises slightly (suppressed vagal activity)
 * - Hold: Heart rate stabilizes and begins gradual descent
 * - Exhale: Heart rate drops gracefully (stimulated vagus nerve), leading to high immediate heart rate variability (HRV).
 */
export function calculateRealtimeBiometrics(
  phase: "ready" | "inhale" | "hold" | "exhale",
  timeLeft: number,
  cycleCount: number
): { bpm: number; hrv: number; coherence: number } {
  const baseBpm = 70 - Math.min(5, cycleCount); // breathing lowers average heart rate over multiple cycles
  const baseHrv = 50 + cycleCount * 5; // HRV improves with consecutive cycles

  if (phase === "ready") {
    return { bpm: 72, hrv: 48, coherence: 15 };
  }

  if (phase === "inhale") {
    // scale up from base to base + 8-12 bpm
    const progress = (4 - timeLeft) / 4;
    const bpm = Math.round(baseBpm + progress * 10);
    const hrv = Math.round(baseHrv - progress * 5); // temporary decrease in variability during inhale
    const coherence = Math.round(30 + progress * 30);
    return { bpm, hrv, coherence };
  }

  if (phase === "hold") {
    // gradual drift down from peak bpm, hrv slightly recovers
    const progress = (7 - timeLeft) / 7;
    const bpm = Math.round((baseBpm + 10) - progress * 6);
    const hrv = Math.round((baseHrv - 5) + progress * 10);
    const coherence = Math.round(60 + progress * 15);
    return { bpm, hrv, coherence };
  }

  if (phase === "exhale") {
    // deep drop in bpm (down to base - 6), high spike in HRV representing vagal activation
    const progress = (8 - timeLeft) / 8;
    const bpm = Math.round((baseBpm + 4) - progress * 12);
    const hrv = Math.round((baseHrv + 5) + progress * 20); // Spike representing high RMSSD / HRV
    const coherence = Math.round(75 + progress * 20);
    return { bpm, hrv, coherence };
  }

  return { bpm: 72, hrv: 48, coherence: 10 };
}
