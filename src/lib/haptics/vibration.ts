'use client';

export function triggerHaptic(type: 'light' | 'medium' | 'success' | 'warning' | 'chaos' = 'light') {
  if (typeof window === 'undefined' || !navigator || !navigator.vibrate) {
    return;
  }

  try {
    switch (type) {
      case 'light':
        navigator.vibrate(15);
        break;
      case 'medium':
        navigator.vibrate(35);
        break;
      case 'success':
        navigator.vibrate([20, 40, 60]);
        break;
      case 'warning':
        navigator.vibrate([40, 60, 40]);
        break;
      case 'chaos':
        navigator.vibrate([50, 30, 80, 40, 100]);
        break;
    }
  } catch {
    // Non-critical
  }
}
