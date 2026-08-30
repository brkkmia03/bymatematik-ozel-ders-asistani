import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@bymatematik.app',
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
);
const TZ = 'Europe/Istanbul';
const parts = (d: Date) => Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(d).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));

Deno.serve(async (req) => {
  if (req.headers.get('x-cron-secret') !== Deno.env.get('PUSH_CRON_SECRET')) return new Response('Unauthorized',{status:401});
  const now = new Date(); const p = parts(now); const today=`${p.year}-${p.month}-${p.day}`; const nowMin=Number(p.hour)*60+Number(p.minute);
  const { data: states, error } = await supabase.from('app_state').select('user_id,data');
  if (error) return new Response(error.message,{status:500});
  let sent=0;
  for (const row of states || []) {
    const data:any=row.data||{}; if (!data.settings?.enableNotifications) continue;
    const leads:number[]=data.settings?.notificationLeadTimes||[];
    const lessons=(data.lessons||[]).filter((l:any)=>l.date===today && !['İptal Edildi','Öğretmen İptal Etti','Ertelendi','Tamamlandı'].includes(l.status));
    const { data: subs } = await supabase.from('push_subscriptions').select('*').eq('user_id',row.user_id);
    if (!subs?.length) continue;
    for (const l of lessons) { const [h,m]=String(l.startTime).split(':').map(Number); const diff=h*60+m-nowMin;
      for (const lead of leads) { if (Math.abs(diff-lead)>2) continue;
        const { data: logged }=await supabase.from('push_delivery_log').select('id').eq('user_id',row.user_id).eq('lesson_id',l.id).eq('lead_minutes',lead).eq('lesson_date',today).maybeSingle(); if(logged) continue;
        const st=(data.students||[]).find((s:any)=>s.id===l.studentId); const name=st?`${st.firstName} ${st.lastName}`:'Öğrenci';
        const payload=JSON.stringify({title:'Ders Hatırlatması',body:`${name} • ${l.startTime} • ${l.topic||'Matematik Dersi'}`,tag:`lesson-${l.id}-${lead}`,url:'/'});
        let delivered=false; for (const sub of subs) { try { await webpush.sendNotification({endpoint:sub.endpoint,keys:{p256dh:sub.p256dh,auth:sub.auth}},payload); delivered=true; } catch(e:any) { if(e?.statusCode===404||e?.statusCode===410) await supabase.from('push_subscriptions').delete().eq('id',sub.id); } }
        if(delivered){ await supabase.from('push_delivery_log').insert({user_id:row.user_id,lesson_id:l.id,lead_minutes:lead,lesson_date:today}); sent++; }
      }
    }
  }
  return Response.json({ok:true,sent});
});
