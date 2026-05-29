"use client";

import { useCallback } from "react";

type HapticImpactStyle = "light" | "medium" | "heavy";
type HapticNotificationType = "success" | "warning" | "error";

// Web Vibration API patterns (Android PWA fallback)
const VIBRATION_PATTERNS = {
  light: 10,
  medium: 20,
  heavy: 30,
  success: [10, 50, 10],
  warning: [20, 30, 20],
  error: [30, 30, 30],
  selection: 5,
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
      navigator.vibrate(VIBRATION_PATTERNS[style]);
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
      navigator.vibrate(VIBRATION_PATTERNS[type]);
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
      navigator.vibrate(VIBRATION_PATTERNS.selection);
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
