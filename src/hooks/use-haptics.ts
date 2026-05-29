"use client";

import { useCallback } from "react";

type HapticImpactStyle = "light" | "medium" | "heavy";
type HapticNotificationType = "success" | "warning" | "error";

// Web Vibration API patterns (Android PWA fallback)
const VIBRATION_PATTERNS = {
  light: 30,
  medium: 50,
  heavy: 80,
  success: [30, 80, 30],
  warning: [50, 50, 50],
  error: [80, 50, 80],
  selection: 15,
} as const;

async function impact(style: HapticImpactStyle = "light") {
  try {
    const { Capacitor } = await import("@capacitor/core");

    if (Capacitor.isNativePlatform()) {
      const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
      const map = {
        light: ImpactStyle.Light,
        medium: ImpactStyle.Medium,
        heavy: ImpactStyle.Heavy,
      };
      await Haptics.impact({ style: map[style] });
    } else if (typeof navigator !== "undefined" && navigator.vibrate) {
      // Web Vibration API fallback (Android PWA)
      console.log('[haptics] Web vibrate:', VIBRATION_PATTERNS[style]);
      navigator.vibrate(VIBRATION_PATTERNS[style]);
    } else {
      console.log('[haptics] No vibrate available. navigator.vibrate:', typeof navigator?.vibrate);
    }
  } catch {
    // Not available — silent no-op
  }
}

async function notification(type: HapticNotificationType = "success") {
  try {
    const { Capacitor } = await import("@capacitor/core");

    if (Capacitor.isNativePlatform()) {
      const { Haptics, NotificationType } = await import("@capacitor/haptics");
      const map = {
        success: NotificationType.Success,
        warning: NotificationType.Warning,
        error: NotificationType.Error,
      };
      await Haptics.notification({ type: map[type] });
    } else if (typeof navigator !== "undefined" && navigator.vibrate) {
      // Web Vibration API fallback (Android PWA)
      console.log('[haptics] Web vibrate notification:', VIBRATION_PATTERNS[type]);
      navigator.vibrate(VIBRATION_PATTERNS[type]);
    } else {
      console.log('[haptics] No vibrate available. navigator.vibrate:', typeof navigator?.vibrate);
    }
  } catch {
    // Not available — silent no-op
  }
}

async function selection() {
  try {
    const { Capacitor } = await import("@capacitor/core");

    if (Capacitor.isNativePlatform()) {
      const { Haptics } = await import("@capacitor/haptics");
      await Haptics.selectionStart();
    } else if (typeof navigator !== "undefined" && navigator.vibrate) {
      // Web Vibration API fallback (Android PWA)
      console.log('[haptics] Web vibrate selection:', VIBRATION_PATTERNS.selection);
      navigator.vibrate(VIBRATION_PATTERNS.selection);
    } else {
      console.log('[haptics] No vibrate available. navigator.vibrate:', typeof navigator?.vibrate);
    }
  } catch {
    // Not available — silent no-op
  }
}

export function useHaptics() {
  const impactLight = useCallback(() => impact("light"), []);
  const impactMedium = useCallback(() => impact("medium"), []);
  const impactHeavy = useCallback(() => impact("heavy"), []);
  const notifySuccess = useCallback(() => notification("success"), []);
  const notifyWarning = useCallback(() => notification("warning"), []);
  const notifyError = useCallback(() => notification("error"), []);
  const selectionStart = useCallback(() => selection(), []);

  return {
    impactLight,
    impactMedium,
    impactHeavy,
    notifySuccess,
    notifyWarning,
    notifyError,
    selectionStart,
  };
}
