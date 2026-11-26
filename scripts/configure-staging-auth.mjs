import {pathToFileURL} from 'node:url';

const projectRef = 'lpsudmemxqkywkpixgae';
const callback = 'https://restart-2-closed-pilot.brawnymarch5.chatgpt.site/app/';
const hook = 'pg-functions://postgres/public/restart_before_user_created';
const endpoint = 'https://api.supabase.com/v1/projects/'+projectRef+'/config/auth';

export async function configureStagingAuth({token, apply = false, request = fetch}) {
 if (!token) throw Error('An authorized Supabase Management API token is required.');
 const desired = {
  site_url:callback,
  uri_allow_list:callback,
  hook_before_user_created_enabled:true,
  hook_before_user_created_uri:hook
 };
 async function call(method, changes) {
  const response = await request(endpoint,{
   method, redirect:'error',
   headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
   body:changes ? JSON.stringify(changes) : undefined,
   signal:AbortSignal.timeout(15000)
  });
  if (!response.ok) throw Error('Supabase Management API '+method+' returned HTTP '+response.status+'.');
  if (method==='GET') return response.json();
 }
 const before = await call('GET');
 const changes = Object.fromEntries(Object.entries(desired).filter(([key,value])=>before[key]!==value));
 if (!apply || !Object.keys(changes).length) return {applied:false,changes};
 const redirects = (before.uri_allow_list ?? '').split(',').map(value=>value.trim()).filter(Boolean);
 if (redirects.some(url=>url!==callback) || (before.hook_before_user_created_uri && before.hook_before_user_created_uri!==hook)) {
  throw Error('Staging already has a different hook or additional redirects. Review its configuration before replacing them.');
 }
 await call('PATCH',changes);
 const after = await call('GET');
 if (Object.entries(desired).some(([key,value])=>after[key]!==value)) {
  throw Error('Auth configuration readback differs from the requested values.');
 }
 return {applied:true,changes};
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href===import.meta.url) {
 try {
  const flags=process.argv.slice(2);
  if (flags.some(flag=>flag!=='--apply')) throw Error('Supported option: --apply.');
  const result=await configureStagingAuth({token:process.env.SUPABASE_ACCESS_TOKEN,apply:flags.includes('--apply')});
  console.log(JSON.stringify(result,null,2));
 } catch (error) {
  console.error(error.message);
  process.exitCode=1;
 }
}
