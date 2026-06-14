/**
 * Safe utility functions for Tauri IPC and native desktop features.
 * Ensures the application remains fully functional in standard web browsers / sandboxes
 * and adapts smoothly with native capabilities when launched inside the Tauri desktop shell (tauri dev).
 */

/**
 * Returns true if the React app is currently running inside the Tauri window/WebView.
 */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || (window as any).__TAURI__ !== undefined);
}

/**
 * Safely invokes a Rust command configured in src-tauri/src/main.rs.
 * Falls back to standard client-side logs or mocks under standard browsers.
 */
export async function invokeSafe<T>(cmd: string, args?: Record<string, any>, fallback?: T): Promise<T> {
  if (isTauri()) {
    try {
      // Dynamic import to prevent compile-time type resolution errors on some local environments
      const api: any = await import('@tauri-apps/api/core' as any).catch(() => null);
      if (api && typeof api.invoke === 'function') {
        return await api.invoke(cmd, args);
      }
      
      // Fallback helper in window if standard module core is packed differently
      const winTauri = (window as any).__TAURI__;
      if (winTauri && typeof winTauri.invoke === 'function') {
        return await winTauri.invoke(cmd, args);
      }
    } catch (e) {
      console.warn(`[Tauri Command Event] command "${cmd}" failed, falling back. Error:`, e);
      return fallback as T;
    }
  }
  return fallback as T;
}

/**
 * Safely triggers an OS native push notification or standard browser notification fallback.
 */
export async function sendNotification(title: string, body: string): Promise<void> {
  if (isTauri()) {
    try {
      // Try local standard Web API notification or modern plugins safely
      const plugin: any = await import('@tauri-apps/api/notification' as any)
        .catch(() => import('@tauri-apps/plugin-notification' as any))
        .catch(() => null);
        
      if (plugin) {
        const isPermissionGranted = plugin.isPermissionGranted || (plugin.default?.isPermissionGranted);
        const requestPermission = plugin.requestPermission || (plugin.default?.requestPermission);
        const notify = plugin.sendNotification || (plugin.default?.sendNotification);
        
        if (typeof isPermissionGranted === 'function' && typeof notify === 'function') {
          let permissionGranted = await isPermissionGranted();
          if (!permissionGranted && typeof requestPermission === 'function') {
            const permission = await requestPermission();
            permissionGranted = permission === 'granted';
          }
          if (permissionGranted) {
            notify({ title, body });
            return;
          }
        }
      }
    } catch (e) {
      console.warn('[Tauri Notification Error] fallback to web browser notify:', e);
    }
  }
  
  // Clean fallback using standard browser Notification API
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification(title, { body });
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification(title, { body });
      }
    }
  }
}
