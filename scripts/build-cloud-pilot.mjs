import {build} from 'esbuild';
import {readFile,writeFile,cp,mkdir,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const projectUrl = process.env.RESTART_SUPABASE_URL || '';
const key = process.env.RESTART_SUPABASE_PUBLISHABLE_KEY || '';
const verifyOnly = process.argv.includes('--verify');
if (!verifyOnly && (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(projectUrl) ||
    !/^sb_publishable_[A-Za-z0-9_-]+$/.test(key))) {
 throw Error('Set RESTART_SUPABASE_URL and RESTART_SUPABASE_PUBLISHABLE_KEY (sb_publishable_…); use the hosted Supabase Project URL.');
}
const root = new URL('../',import.meta.url).pathname;
const bundle = {
 stdin:{contents:"export {createClient} from '@supabase/supabase-js'",resolveDir:root},
 absWorkingDir:root,
 bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true
};
if (verifyOnly) {
 await build({...bundle,write:false});
 console.log('Supabase SDK builds for the browser. No pilot configuration was generated.');
 process.exit(0);
}
const url = new URL(projectUrl);
const out = new URL('../dist/',import.meta.url);
await mkdir(out,{recursive:true});
await cp(new URL('../app/',import.meta.url),new URL('app/',out),{recursive:true});
await cp(new URL('../assets/pwa/',import.meta.url),new URL('assets/pwa/',out),{recursive:true});
await mkdir(new URL('assets/brand/',out),{recursive:true});
for (const file of ['restart-640.webp','restart-1188.webp']) {
 await cp(new URL('../assets/brand/'+file,import.meta.url),new URL('assets/brand/'+file,out));
}
await writeFile(new URL('app/cloud-config.mjs',out),'export default '+JSON.stringify({url:url.origin,key})+';\n');

const index = new URL('app/index.html',out);
const html = await readFile(index,'utf8');
await writeFile(index,html.replace("default-src 'self';", "default-src 'self'; connect-src 'self' "+url.origin+";"));
await build({...bundle,outfile:new URL('app/supabase-sdk.mjs',out).pathname});

const revision = createHash('sha256');
for (const name of (await readdir(new URL('app/',out))).sort()) revision.update(await readFile(new URL('app/'+name,out)));
const serviceWorker = new URL('app/sw.js',out);
const source = await readFile(serviceWorker,'utf8');
await writeFile(serviceWorker,source
 .replace(/const VERSION = '[^']*';/,"const VERSION = 'pilot-"+revision.digest('hex').slice(0,16)+"';")
 .replace(" './index.html',"," './supabase-sdk.mjs','./index.html',"));
console.log('Pilot built in dist/; open /app/ on a separate staging origin.');
