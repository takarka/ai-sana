// Одна точка правды про «меньше движения» для ревилов и скролл-скраба:
// в eighth-version это была переменная `reduced` в core.js.
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
