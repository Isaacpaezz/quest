"use client";

import { useCallback } from "react";

type HapticImpactStyle = "light" | "medium" | "heavy";
type HapticNotificationType = "success" | "warning" | "error";

async function impact(style: HapticImpactStyle = "light") {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) return;

    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    const map = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy,
    };
    await Haptics.impact({ style: map[style] });
  } catch {
    // Not available — silent no-op
  }
}

async function notification(type: HapticNotificationType = "success") {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) return;

    const { Haptics, NotificationType } = await import("@capacitor/haptics");
    const map = {
      success: NotificationType.Success,
      warning: NotificationType.Warning,
      error: NotificationType.Error,
    };
    await Haptics.notification({ type: map[type] });
  } catch {
    // Not available — silent no-op
  }
}

async function selection() {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) return;

    const { Haptics } = await import("@capacitor/haptics");
    await Haptics.selectionStart();
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
