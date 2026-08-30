import { supabase } from './supabase';
export interface CloudStateRow<T=Record<string,unknown>> { user_id:string; data:T; schema_version:number; created_at:string; updated_at:string; }
export class CloudConflictError extends Error { constructor(){ super('Bulut verisi başka bir cihazda değiştirildi.'); this.name='CloudConflictError'; } }
export async function loadCloudState<T=Record<string,unknown>>(userId:string):Promise<CloudStateRow<T>|null>{
 const {data,error}=await supabase.from('app_state').select('user_id,data,schema_version,created_at,updated_at').eq('user_id',userId).maybeSingle();
 if(error) throw error; return (data as CloudStateRow<T>|null)??null;
}
export async function saveCloudState<T extends Record<string,unknown>>(userId:string,payload:T,expectedUpdatedAt?:string|null):Promise<CloudStateRow<T>>{
 if(!expectedUpdatedAt){ const {data,error}=await supabase.from('app_state').upsert({user_id:userId,data:payload,schema_version:1},{onConflict:'user_id'}).select('user_id,data,schema_version,created_at,updated_at').single(); if(error) throw error; return data as CloudStateRow<T>; }
 const {data,error}=await supabase.from('app_state').update({data:payload,schema_version:1}).eq('user_id',userId).eq('updated_at',expectedUpdatedAt).select('user_id,data,schema_version,created_at,updated_at').maybeSingle();
 if(error) throw error; if(!data) throw new CloudConflictError(); return data as CloudStateRow<T>;
}
