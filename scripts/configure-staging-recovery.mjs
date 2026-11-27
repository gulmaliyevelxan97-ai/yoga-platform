import {pathToFileURL} from 'node:url';

const endpoint='https://api.supabase.com/v1/projects/lpsudmemxqkywkpixgae/config/auth';
const field='mailer_templates_recovery_content';
const subject='mailer_subjects_recovery';
const callback='https://gulmaliyevelxan97-ai.github.io/restart-2-pilot/participants/';
const template='<p>Ваш одноразовый код для восстановления пароля RESTART:</p><p><strong>{{ .Token }}</strong></p><p>Введите код на <a href="'+callback+'">странице входа RESTART</a>.</p>';
const desired={[field]:template,[subject]:'Код восстановления пароля RESTART'};

export async function configureStagingRecovery({token,apply=false,request=fetch}) {
 if (!token) throw new Error('Authorized Supabase Management API token is required.');
 async function call(method,body) {
  const response=await request(endpoint,{method,redirect:'error',signal:AbortSignal.timeout(15000),
   headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
   body:body&&JSON.stringify(body)});
  if (!response.ok) throw new Error('Supabase Management API '+method+' returned HTTP '+response.status+'.');
  if(method==='GET') return response.json();
 }
 const before=await call('GET');
 const redirects=(before.uri_allow_list??'').split(',').map(url=>url.trim());
 if(before.site_url!==callback || !redirects.includes(callback)) {
  throw new Error('Review the exact participant Site URL and Redirect URL before changing the email template.');
 }
 const patch=Object.fromEntries(Object.entries(desired).filter(([key,value])=>before[key]!==value));
 if (!apply || !Object.keys(patch).length) return {applied:false,changes:Object.keys(patch)};
 await call('PATCH',patch);
 const after=await call('GET');
 if (Object.entries(desired).some(([key,value])=>after[key]!==value)) throw new Error('Recovery template readback failed.');
 return {applied:true,changes:Object.keys(patch)};
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href===import.meta.url) {
 try {
  const flags=process.argv.slice(2);
  if(flags.some(flag=>flag!=='--apply')) throw new Error('Supported option: --apply.');
  console.log(JSON.stringify(await configureStagingRecovery({token:process.env.SUPABASE_ACCESS_TOKEN,apply:flags.includes('--apply')})));
 } catch(error) {
  console.error(error.message);
  process.exitCode=1;
 }
}
