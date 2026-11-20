import {build} from 'esbuild';
import {readFile,writeFile,cp,mkdir,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const projectUrl = process.env.RESTART_SUPABASE_URL || '';
const key = process.env.RESTART_SUPABASE_PUBLISHABLE_KEY || '';
const verifyOnly = process.argv.includes('--verify');
if (!verifyOnly && (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(projectUrl) ||
    !/^sb_publishable_[A-Za-z0-9_-]+$/.test(key))) {
 throw Error('Set RESTART_SUPABASE_URL and RESTART_SUPABASE_PUBLISHABLE_KEY (sb_publishable_…); use the hosted Supabase Project URL.');
}
const root = fileURLToPath(new URL('../',import.meta.url));
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
const out = pathToFileURL(resolve(root, process.env.RESTART_PILOT_OUTPUT || 'dist') + '/');
// A fresh output folder prevents stale files from becoming part of the pilot.
try {
 await mkdir(out);
} catch (error) {
 if (error.code !== 'EEXIST') throw error;
 throw new Error('Pilot output already exists. Set RESTART_PILOT_OUTPUT to a new directory.');
}
const runtimeFiles = {
 app:['index.html','style.css','ui.mjs','content.mjs','state.mjs','manifest.webmanifest','sw.js',
  'cloud-auth.mjs','cloud-copy.mjs','cloud-data.mjs','school.mjs','school-notices.mjs','academy-programs.mjs','booking-calendar.mjs','personal-plan.mjs','progress-view.mjs'],
 'assets/brand':['restart-640.webp','restart-1188.webp'],
 'assets/pwa':['restart-192.png','restart-512.png','restart-maskable.png','restart-apple.png']
};
for (const [folder,files] of Object.entries(runtimeFiles)) {
 await mkdir(new URL(folder+'/',out),{recursive:true});
 for (const file of files) {
  const path = folder+'/'+file;
  await cp(new URL(path,pathToFileURL(root)),new URL(path,out));
 }
}
await writeFile(new URL('app/cloud-config.mjs',out),'export default '+JSON.stringify({url:url.origin,key})+';\n');

const index = new URL('app/index.html',out);
const html = await readFile(index,'utf8');
await writeFile(index,html.replace("default-src 'self';", "default-src 'self'; connect-src 'self' "+url.origin+";"));
await build({...bundle,outfile:fileURLToPath(new URL('app/supabase-sdk.mjs',out))});

const revision = createHash('sha256');
for (const name of (await readdir(new URL('app/',out))).sort()) revision.update(await readFile(new URL('app/'+name,out)));
const serviceWorker = new URL('app/sw.js',out);
const source = await readFile(serviceWorker,'utf8');
const workerVersion = "const VERSION = 'pilot-"+revision.digest('hex').slice(0,16)+"';";
await writeFile(serviceWorker, source.replace(/const VERSION = '[^']*';/,workerVersion) +
 "\nresources.add(new URL('./supabase-sdk.mjs',base).href);\n");
console.log('Pilot built at '+fileURLToPath(out)+'. Serve /app/ on a separate staging origin.');
