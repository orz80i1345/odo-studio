export function isLineInAppBrowser() {
  if (typeof navigator === 'undefined') return false
  return /\bLine\//i.test(navigator.userAgent)
}
