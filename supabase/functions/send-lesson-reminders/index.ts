import { createClient } from 'npm:@supabase/supabase-js@2';
import { sendNotification } from 'npm:web-push-neo@0.1.2';

const TZ = 'Europe/Istanbul';
const END_NOTIFICATION_LEAD = -1;

const parts = (d: Date) => Object.fromEntries(
  new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
    .formatToParts(d)
    .filter((x) => x.type !== 'literal')
    .map((x) => [x.type, x.value]),
);

const getAdminKey = () => {
  const secretKeys = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (secretKeys) {
    try {
      const parsed = JSON.parse(secretKeys);
      if (parsed?.default) return String(parsed.default);
      const first = Object.values(parsed || {})[0];
      if (first) return String(first);
    } catch {
      // Legacy service-role fallback below.
    }
  }
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const adminKey = getAdminKey();
const vapidDetails = {
  subject: Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@bymatematik.app',
  publicKey: Deno.env.get('VAPID_PUBLIC_KEY') || '',
  privateKey: Deno.env.get('VAPID_PRIVATE_KEY') || '',
};

const supabase = createClient(supabaseUrl, adminKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const sendPushToSubscriptions = async (
  subscriptions: any[],
  payload: Record<string, unknown>,
) => {
  let delivered = false;
  for (const sub of subscriptions) {
    try {
      await sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(payload),
        {
          vapidDetails,
          TTL: 120,
          urgency: 'high',
          signal: AbortSignal.timeout(5000),
        },
      );
      delivered = true;
    } catch (error: any) {
      const statusCode = Number(error?.statusCode || error?.status || 0);
      console.error('Push gönderilemedi', { statusCode, lessonTag: payload.tag });
      if (statusCode === 404 || statusCode === 410) {
        await supabase.from('push_subscriptions').delete().eq('id', sub.id);
      }
    }
  }
  return delivered;
};

const alreadyLogged = async (userId: string, lessonId: string, lead: number, lessonDate: string) => {
  const { data } = await supabase
    .from('push_delivery_log')
    .select('id')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .eq('lead_minutes', lead)
    .eq('lesson_date', lessonDate)
    .maybeSingle();
  return Boolean(data);
};

const markLogged = async (userId: string, lessonId: string, lead: number, lessonDate: string) => {
  await supabase.from('push_delivery_log').insert({
    user_id: userId,
    lesson_id: lessonId,
    lead_minutes: lead,
    lesson_date: lessonDate,
  });
};

Deno.serve(async (req) => {
  try {
    if (req.headers.get('x-cron-secret') !== Deno.env.get('PUSH_CRON_SECRET')) {
      return new Response('Unauthorized', { status: 401 });
    }
    if (!supabaseUrl || !adminKey || !vapidDetails.publicKey || !vapidDetails.privateKey) {
      console.error('Eksik sunucu yapılandırması', {
        hasUrl: Boolean(supabaseUrl),
        hasAdminKey: Boolean(adminKey),
        hasPublicKey: Boolean(vapidDetails.publicKey),
        hasPrivateKey: Boolean(vapidDetails.privateKey),
      });
      return new Response('Server configuration missing', { status: 500 });
    }

    const now = new Date();
    const p = parts(now);
    const today = `${p.year}-${p.month}-${p.day}`;
    const nowMin = Number(p.hour) * 60 + Number(p.minute);

    const { data: states, error } = await supabase.from('app_state').select('user_id,data');
    if (error) {
      console.error('app_state okunamadı', error.message);
      return new Response(error.message, { status: 500 });
    }

    let sent = 0;
    for (const row of states || []) {
      const data: any = row.data || {};
      if (!data.settings?.enableNotifications) continue;

      const leads: number[] = Array.isArray(data.settings?.notificationLeadTimes)
        ? data.settings.notificationLeadTimes
        : [];
      const lessons = (data.lessons || []).filter(
        (l: any) => l.date === today && !['İptal Edildi', 'Öğretmen İptal Etti', 'Ertelendi', 'Öğrenci Katılmadı'].includes(l.status),
      );

      const { data: subs, error: subError } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', row.user_id);
      if (subError) {
        console.error('Push abonelikleri okunamadı', subError.message);
        continue;
      }
      if (!subs?.length) continue;

      for (const lesson of lessons) {
        const [h, m] = String(lesson.startTime).split(':').map(Number);
        if (!Number.isFinite(h) || !Number.isFinite(m)) continue;
        const startMinute = h * 60 + m;
        const duration = Math.max(1, Number(lesson.duration || 60));
        const endMinute = startMinute + duration;
        const student = (data.students || []).find((s: any) => s.id === lesson.studentId);
        const studentName = student ? `${student.firstName} ${student.lastName}` : 'Öğrenci';

        // Ders öncesi hatırlatmaları.
        if (lesson.status !== 'Tamamlandı') {
          const diff = startMinute - nowMin;
          for (const lead of leads) {
            if (Math.abs(diff - lead) > 2) continue;
            if (await alreadyLogged(row.user_id, lesson.id, lead, today)) continue;

            const delivered = await sendPushToSubscriptions(subs, {
              title: 'Ders Hatırlatması',
              body: `${studentName} • ${lesson.startTime} • ${lesson.topic || 'Matematik Dersi'}`,
              tag: `lesson-${lesson.id}-${lead}`,
              url: '/',
            });
            if (delivered) {
              await markLogged(row.user_id, lesson.id, lead, today);
              sent += 1;
            }
          }
        }

        // Ders bitiş bildirimi: cron dakikada bir çalıştığı için bitişten sonraki
        // ilk iki dakikalık pencerede tek kez gönderilir. Lead -1, bu bildirimin
        // normal ders öncesi loglarından ayrılmasını sağlar.
        const minutesAfterEnd = nowMin - endMinute;
        if (minutesAfterEnd >= 0 && minutesAfterEnd <= 2) {
          if (!(await alreadyLogged(row.user_id, lesson.id, END_NOTIFICATION_LEAD, today))) {
            const delivered = await sendPushToSubscriptions(subs, {
              title: 'Ders Süresi Tamamlandı',
              body: `${studentName} • ${lesson.topic || 'Matematik Dersi'} • ${duration} dk`,
              tag: `lesson-end-${lesson.id}`,
              url: '/',
            });
            if (delivered) {
              await markLogged(row.user_id, lesson.id, END_NOTIFICATION_LEAD, today);
              sent += 1;
            }
          }
        }
      }
    }

    return Response.json({ ok: true, sent });
  } catch (error: any) {
    console.error('send-lesson-reminders beklenmeyen hata', error?.message || error);
    return new Response(`Unexpected error: ${error?.message || 'unknown'}`, { status: 500 });
  }
});
