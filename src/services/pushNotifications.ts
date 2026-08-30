import { supabase } from './supabase';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function pushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export async function getPushStatus(): Promise<'unsupported'|'unconfigured'|'denied'|'enabled'|'disabled'> {
  if (!pushSupported()) return 'unsupported';
  if (!import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY) return 'unconfigured';
  if (Notification.permission === 'denied') return 'denied';
  const registration = await navigator.serviceWorker.ready;
  return (await registration.pushManager.getSubscription()) ? 'enabled' : 'disabled';
}

export async function enablePushNotifications(userId: string) {
  if (!pushSupported()) throw new Error('Bu cihaz web push bildirimlerini desteklemiyor.');
  const publicKey = import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY;
  if (!publicKey) throw new Error('Telefon bildirim sunucusu henüz yapılandırılmadı.');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Bildirim izni verilmedi.');
  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
  }
  const json = subscription.toJSON();
  const { error } = await supabase.from('push_subscriptions').upsert({
    user_id: userId,
    endpoint: json.endpoint,
    p256dh: json.keys?.p256dh,
    auth: json.keys?.auth,
    user_agent: navigator.userAgent,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,endpoint' });
  if (error) throw error;
  return true;
}

export async function disablePushNotifications(userId: string) {
  if (!pushSupported()) return;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;
  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();
  await supabase.from('push_subscriptions').delete().eq('user_id', userId).eq('endpoint', endpoint);
}
