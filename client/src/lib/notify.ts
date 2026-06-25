const ICON = "/icons/icon-192.png";

export async function requestNotifyPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }
}

export function sendNotification(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, icon: ICON, silent: false });
  } catch {
    // Some browsers block Notification in certain contexts — silently ignore.
  }
}
