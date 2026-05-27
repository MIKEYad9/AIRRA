import { create } from "zustand";

/**
 * AIRRA Production Observability & Business Analytics Service
 * Instrumented for PostHog event funnels, Sentry-safe error containment,
 * conversion optimizations, and system latency monitoring.
 */

// Simple State Log to drive Founder Business Intelligence console inside SPA
interface ObservabilityState {
  events: Array<{ eventName: string; properties: any; timestamp: string }>;
  errors: Array<{ message: string; fatal: boolean; timestamp: string; componentStack?: string }>;
  latencies: Array<{ metric: string; durationMs: number; timestamp: string }>;
  logEvent: (eventName: string, properties?: any) => void;
  logError: (message: string, fatal?: boolean, componentStack?: string) => void;
  recordLatency: (metric: string, durationMs: number) => void;
  clearAll: () => void;
}

export const useObservabilityStore = create<ObservabilityState>((set) => ({
  events: [],
  errors: [],
  latencies: [],
  logEvent: (eventName, properties = {}) => {
    // Console log for local Dev audits
    if (process.env.NODE_ENV !== "production") {
      console.log(`[POSTHOG_EVENT]: ${eventName}`, properties);
    }
    set((state) => ({
      events: [{ eventName, properties, timestamp: new Date().toISOString() }, ...state.events].slice(0, 100),
    }));
  },
  logError: (message, fatal = false, componentStack = "") => {
    console.error(`[SENTRY_TRIGGERED] (${fatal ? "FATAL" : "NON-FATAL"}):`, message, componentStack);
    set((state) => ({
      errors: [{ message, fatal, timestamp: new Date().toISOString(), componentStack }, ...state.errors].slice(0, 100),
    }));
  },
  recordLatency: (metric, durationMs) => {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[TELEM_LATENCY]: ${metric} -> ${durationMs}ms`);
    }
    set((state) => ({
      latencies: [{ metric, durationMs, timestamp: new Date().toISOString() }, ...state.latencies].slice(0, 100),
    }));
  },
  clearAll: () => set({ events: [], errors: [], latencies: [] }),
}));

/**
 * Capture custom page view route timing
 */
export function trackPageView(pagePath: string) {
  useObservabilityStore.getState().logEvent("Page View", { path: pagePath });
}

/**
 * Capture funnels related to conversion rate optimization (CRO)
 */
export function trackConversionFunnel(step: "LANDING" | "ONBOARDING_START" | "OBJECTIVE_SELECT" | "DASHBOARD_ENTER" | "PRICING_VIEW" | "UPGRADE_INITIALIZE" | "UPGRADE_SUCCESS", payload: Record<string, any> = {}) {
  useObservabilityStore.getState().logEvent(`CRO_Funnel_Step_${step}`, {
    timestamp: new Date().toISOString(),
    ...payload,
  });
}

/**
 * Track Sentry-like JavaScript global exception alerts
 */
export function captureException(error: Error, extraInfo?: string) {
  useObservabilityStore.getState().logError(error.message || "Unknown Exception", true, extraInfo);
}
