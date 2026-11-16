/* Solar System 360 offline worker. A new version starts at once (the page and its code are small); the big
   files (photos, sounds, videos, models) then fill in behind it, copied from the older version when unchanged,
   downloaded otherwise. The older version is kept until the new one has every file, so nothing goes missing offline. */
const VERSION="solarsystem-774622015d";
const CORE=["./", "index.html", "duetgate.js", "manifest.webmanifest", "tex/earth.jpg", "tex/earth_clouds.jpg", "tex/earth_night.jpg", "tex/earth_normal.jpg", "tex/earth_specular.jpg", "tex/jupiter.jpg", "tex/mars.jpg", "tex/mercury.jpg", "tex/moon.jpg", "tex/neptune.jpg", "tex/pluto.jpg", "tex/saturn.jpg", "tex/saturn_ring.png", "tex/stars.jpg", "tex/sun.jpg", "tex/uranus.jpg", "tex/venus.jpg", "vendor/three.min.js", "vendor/GLTFLoader.js", "vendor/meshopt_decoder.js", "tex/moons/ariel.jpg", "tex/moons/callisto.jpg", "tex/moons/charon.jpg", "tex/moons/deimos.jpg", "tex/moons/dione.jpg", "tex/moons/enceladus.jpg", "tex/moons/europa.jpg", "tex/moons/ganymede.jpg", "tex/moons/iapetus.jpg", "tex/moons/io.jpg", "tex/moons/mimas.jpg", "tex/moons/miranda.jpg", "tex/moons/oberon.jpg", "tex/moons/phobos.jpg", "tex/moons/rhea.jpg", "tex/moons/tethys.jpg", "tex/moons/titan.jpg", "tex/moons/titania.jpg", "tex/moons/triton.jpg", "tex/moons/umbriel.jpg", "models/phobos.json", "models/deimos.json", "models/phobos.glb", "models/deimos.glb", "brand/duet-stem-logo-light.png", "models/craft/apollo-lm.glb", "models/craft/cassini.glb", "models/craft/curiosity.glb", "models/craft/dawn.glb", "models/craft/galileo.glb", "models/craft/hubble.glb", "models/craft/ingenuity.glb", "models/craft/iss.glb", "models/craft/juno.glb", "models/craft/jwst.glb", "models/craft/maven.glb", "models/craft/mro.glb", "models/craft/osiris-rex.glb", "models/craft/parker-solar-probe.glb", "models/craft/perseverance.glb", "models/craft/voyager.glb", "sfx/credits.json", "sky/milkyway_8k.jpg", "sky/milkyway_4k.jpg", "sky/stars.json", "sky/nearby.json", "sky/constellations.json", "ch3/loc_h.json", "ch3/loc_wac.jpg", "ch3/reg_h.json", "ch3/reg_wac.jpg", "ch3/regolith.jpg", "ch3/sky.json", "ch3/terrain.json", "ch3/tile_e.jpg", "ch3/tile_n1.jpg", "ch3/tile_n2.jpg", "ch3/tile_n3.jpg", "ch3/tile_s1.jpg", "ch3/tile_site.jpg", "ch3/tile_w.jpg", "ch3/tiles.json", "ch3/track.json", "ch3/vikram_L.jpg", "ch3/vikram_R.jpg", "ch3/vikram_anaglyph.jpg", "ORIGINAL-SOURCES.txt", "fonts/big-shoulders-display-latin-600-normal.woff2", "fonts/big-shoulders-display-latin-800-normal.woff2", "fonts/big-shoulders-display-latin-900-normal.woff2", "fonts/big-shoulders-display-latin-ext-600-normal.woff2", "fonts/big-shoulders-display-latin-ext-800-normal.woff2", "fonts/big-shoulders-display-latin-ext-900-normal.woff2", "fonts/fonts.css", "fonts/ibm-plex-mono-latin-400-normal.woff2", "fonts/ibm-plex-mono-latin-500-normal.woff2", "fonts/ibm-plex-mono-latin-ext-400-normal.woff2", "fonts/ibm-plex-mono-latin-ext-500-normal.woff2", "fonts/ibm-plex-sans-devanagari-devanagari-400-normal.woff2", "fonts/ibm-plex-sans-devanagari-devanagari-500-normal.woff2", "fonts/ibm-plex-sans-devanagari-latin-400-normal.woff2", "fonts/ibm-plex-sans-devanagari-latin-500-normal.woff2", "fonts/ibm-plex-sans-devanagari-latin-ext-400-normal.woff2", "fonts/ibm-plex-sans-devanagari-latin-ext-500-normal.woff2", "fonts/ibm-plex-sans-latin-400-italic.woff2", "fonts/ibm-plex-sans-latin-400-normal.woff2", "fonts/ibm-plex-sans-latin-500-normal.woff2", "fonts/ibm-plex-sans-latin-600-normal.woff2", "fonts/ibm-plex-sans-latin-ext-400-italic.woff2", "fonts/ibm-plex-sans-latin-ext-400-normal.woff2", "fonts/ibm-plex-sans-latin-ext-500-normal.woff2", "fonts/ibm-plex-sans-latin-ext-600-normal.woff2", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png", "icons/apple-touch-icon.png", "icons/box-512.png", "icons/box-maskable-512.png"];
const MEDIA=[];
const HASH={};
async function tell(msg){const cl=await self.clients.matchAll({includeUncontrolled:true,type:"window"});cl.forEach(c=>c.postMessage(msg))}
async function olderCaches(){const out=[];for(const k of await caches.keys()){if(k===VERSION||!k.startsWith("solarsystem-"))continue;try{const c=await caches.open(k);const r=await c.match("__hash.json");out.push({cache:c,hash:r?await r.json():null})}catch(e){}}return out}
/* cache:"reload": the new version's files straight from the website, never the browser's HTTP cache (GitHub Pages lets it keep a page
   for 10 minutes, so a version installed soon after an update saved the previous index.html) */
self.addEventListener("install",e=>{e.waitUntil((async()=>{const cache=await caches.open(VERSION);await cache.addAll(CORE.map(u=>new Request(u,{cache:"reload"})));await self.skipWaiting()})())});
self.addEventListener("activate",e=>{e.waitUntil(self.clients.claim())});
let syncing=null;
/* Every file is checked each time the app opens online, the app's own files too: the browser keeps one shared
   store for all apps on this web address, so another app (or the browser) may have removed some of ours. */
const ALL=CORE.concat(MEDIA);
async function syncMedia(){
  const cache=await caches.open(VERSION),total=ALL.length,old=await olderCaches();let i=0,done=0;
  async function worker(){while(i<ALL.length){const u=ALL[i++];try{
      if(!(await cache.match(u))){let ok=false;
        // unchanged since the older version: move it across (copy, then drop the old copy, so storage never holds two)
        for(const o of old){if(o.hash&&o.hash[u]&&o.hash[u]===HASH[u]){const m=await o.cache.match(u);if(m){await cache.put(u,m);ok=true;try{await o.cache.delete(u)}catch(e){}break}}}
        if(!ok)await cache.add(new Request(u,{cache:"reload"}))}}catch(err){}
    done++;if(done%10===0||done===total)tell({type:"progress",done,total})}}
  await Promise.all([worker(),worker(),worker(),worker(),worker(),worker()]);
  let missing=0;for(const u of ALL)if(!(await cache.match(u)))missing++;
  if(missing){tell({type:"progress",done:total-missing,total});return}
  await cache.put("__hash.json",new Response(JSON.stringify(HASH),{headers:{"Content-Type":"application/json"}}));
  for(const k of await caches.keys())if(k!==VERSION&&k.startsWith("solarsystem-"))await caches.delete(k);
  tell({type:"ready"});
}
self.addEventListener("message",e=>{
  if(e.data==="sync"){if(!syncing)syncing=syncMedia().catch(()=>{}).then(()=>{syncing=null});e.waitUntil(syncing);return}
  if(e.data==="status")e.waitUntil((async()=>{try{const c=await caches.open(VERSION);const have=(await c.keys()).length-1;tell({type:"state",have:Math.max(0,have),total:CORE.length+MEDIA.length})}catch(err){}})())});
// this version's copy first, then any older saved copy (still there while the new one fills in)
async function fromCache(req){const c=await caches.open(VERSION);return (await c.match(req,{ignoreSearch:true}))||(await caches.match(req,{ignoreSearch:true}))}
async function ranged(r){
  const m=await fromCache(r.url);if(!m){try{return await fetch(r)}catch(e){return new Response("",{status:504})}}
  const b=await m.blob(),h=/bytes=(\d*)-(\d*)/.exec(r.headers.get("range")||"")||[];
  const s=h[1]?+h[1]:0,e=Math.min(h[2]?+h[2]:b.size-1,b.size-1);
  return new Response(b.slice(s,e+1),{status:206,headers:{"Content-Type":m.headers.get("Content-Type")||"video/mp4","Content-Range":"bytes "+s+"-"+e+"/"+b.size,"Content-Length":String(e-s+1),"Accept-Ranges":"bytes"}});
}
self.addEventListener("fetch",e=>{
  const r=e.request;if(r.method!=="GET")return;
  const u=new URL(r.url);if(u.origin!==self.location.origin)return;
  if(r.headers.has("range")){e.respondWith(ranged(r));return}
  if(r.mode==="navigate"){e.respondWith((async()=>{
    // always open from the device first: no waiting for (or breaking on) Wi-Fi
    const saved=(await fromCache("index.html"))||(await fromCache("./"));if(saved)return saved;
    try{return await fetch(r)}catch(err){return new Response('<!doctype html><meta name="viewport" content="width=device-width"><body style="background:#05060c;color:#ece7da;font:20px system-ui;display:grid;place-items:center;height:100vh;margin:0;text-align:center"><div><h1 style="color:#ffb347">No internet</h1><p>Connect once to Wi-Fi and open the app: it saves itself on this device and then works offline.</p></div></body>',{headers:{"Content-Type":"text/html"}})}
  })());return}
  const big=/\/video\//.test(u.pathname);
  e.respondWith((async()=>{const m=await fromCache(r);if(m)return m;
    try{const res=await fetch(r);if(res.status===200&&!big){const cp=res.clone();caches.open(VERSION).then(c=>c.put(r,cp)).catch(()=>{})}return res}
    catch(err){return new Response("",{status:504,statusText:"offline"})}})());
});
