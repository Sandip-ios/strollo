// Tiny pub/sub so any client component can kick off the top-of-page
// progress bar before an imperative router.push() — clicking a <Link>
// is caught automatically (see NavigationProgress.tsx), but a
// programmatic navigation (e.g. after an OTP verify or payment) has no
// DOM click event to hook, so call startNavProgress() right before it.
type Listener = () => void;

let listeners: Listener[] = [];

export function startNavProgress(): void {
  listeners.forEach((l) => l());
}

export function onNavProgressStart(cb: Listener): () => void {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}
