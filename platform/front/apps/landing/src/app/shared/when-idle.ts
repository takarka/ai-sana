// Отложенный запуск украшений (WebGL-сцена, скролл-скраб): и то и другое
// не должно занимать поток, пока страница ещё доезжает. В eighth-version
// тот же приём применялся в bootScene() из core.js.
export function whenIdle(run: () => void): void {
  const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number })
    .requestIdleCallback;
  if (idle) idle(run);
  else setTimeout(run, 400);
}
