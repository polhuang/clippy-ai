export function isMobileDevice(): boolean {
  // Check for mobile user agent patterns
  const userAgent = navigator.userAgent.toLowerCase();
  const mobilePatterns = [
    /android/i,
    /webos/i,
    /iphone/i,
    /ipad/i,
    /ipod/i,
    /blackberry/i,
    /windows phone/i,
    /mobile/i
  ];

  // Check user agent
  const isMobileUA = mobilePatterns.some(pattern => pattern.test(userAgent));

  // Check screen size (fallback for desktop browsers in mobile view)
  const isSmallScreen = window.innerWidth <= 768;

  // Check touch support
  const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  return isMobileUA || (isSmallScreen && hasTouchSupport);
}

export function isWebContainerSupported(): boolean {
  // Check for required browser features
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  if (!('SharedArrayBuffer' in window)) {
    return false;
  }

  // Check if we're in a secure context
  if (!window.isSecureContext) {
    return false;
  }

  // Allow mobile devices to attempt WebContainer usage
  // Some modern mobile browsers may support it
  return true;
}

export function getMobileMessage(): string {
  if (!('SharedArrayBuffer' in window)) {
    return "Live preview requires SharedArrayBuffer support. Please ensure your browser is up to date and the site is served with proper CORS headers.";
  }

  if (!('serviceWorker' in navigator)) {
    return "Live preview requires Service Worker support. Please use a modern browser.";
  }

  if (!window.isSecureContext) {
    return "Live preview requires a secure context (HTTPS). Please use HTTPS or localhost.";
  }

  return "Live preview is currently unavailable. Please try refreshing the page or using a different browser.";
}