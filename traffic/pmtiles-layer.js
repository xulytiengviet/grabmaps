/* PMTiles vector overlay for Vietflex/Leaflet, MIT 2026.
 * Uses Protomaps PMTiles v3 range requests + Mapbox vector tile decoding.
 * The CDN libraries are pinned; no server or AWS key is required for public files.
 */
(async()=>{'use strict';
const map=window.trafficMap,holder=document.getElementById('pmtiles-panel');
if(!map||!holder||!window.L)return;
holder.innerHTML='<h2>Kho dữ liệu PMTiles · Cloudflare R2</h2><div id="pm-status" class="hint" aria-live="polite">Đang kiểm tra cấu hình…</div><div class="buttons"><button id="pm-reload">Tải PMTiles</button><button class="secondary" id="pm-hide">Ẩn lớp PMTiles</button></div><p class="hint">Nguồn mặc định: Cloudflare R2 · hcm-traffic.pmtiles. Có thể đổi nguồn trong Settings. Nền Vietflex được giữ nguyên.</p>';
const $=id=>document.getElementById(id),show=t=>$('pm-status').textContent=t;
let tileLayer=null,archive=null,configUrl=null;
const inferredDefault='https://pub-2aa79804a6c64275af743f277eeca6f2.r2.dev/hcm-traffic.pmtiles';
function configuredUrl(){
try{const saved=JSON.parse(localStorage.getItem('hcm-traffic-public-service-config-v1')||'{}');const x=saved.pmtiles||inferredDefault,u=new URL(x,location.href);if(u.protocol!=='https:'||u.username||u.password)return null;return u.href}catch(_){return inferredDefault}}
async function dependencies(){
const [pm,pbf,vt]=await Promise.all([
import('https://cdn.jsdelivr.net/npm/pmtiles@3.2.1/+esm'),
import('https://cdn.jsdelivr.net/npm/pbf@3.3.0/+esm'),
import('https://cdn.jsdelivr.net/npm/@mapbox/vector-tile@2.0.3/+esm')]);
return {PMTiles:pm.PMTiles,Pbf:pbf.default||pbf,VectorTile:vt.VectorTile};
}
function renderObject(ctx,shape,type,size){
if(!shape||!shape.length)return;
const scale=size/4096;
if(type===1){ctx.fillStyle='#0e7490';for(const ring of shape)for(const p of ring){ctx.beginPath();ctx.arc(p.x*scale,p.y*scale,3,0,Math.PI*2);ctx.fill()}return}
if(type!==2&&type!==3)return;
ctx.beginPath();for(const ring of shape){let first=true;for(const p of ring){if(first){ctx.moveTo(p.x*scale,p.y*scale);first=false}else ctx.lineTo(p.x*scale,p.y*scale)}if(type===3)ctx.closePath()}
if(type===3){ctx.fillStyle='rgba(14,165,233,.10)';ctx.fill('evenodd')}else{ctx.stroke();}}
function paint(tileBytes,canvas,deps){
const ctx=canvas.getContext('2d'),size=256,vt=new deps.VectorTile(new deps.Pbf(tileBytes));
ctx.clearRect(0,0,size,size);
for(const [layerName,layer] of Object.entries(vt.layers)){
const lname=layerName.toLowerCase();
const isRoad=/road|transport|highway|street/.test(lname),isWater=/water|river|canal/.test(lname),isBridge=/bridge|tunnel/.test(lname),isPoi=/point|poi|sign|stop|junction|node/.test(lname),isZone=/service_zones|coverage_zone|traffic_zone/.test(lname);
if(!isRoad&&!isWater&&!isBridge&&!isPoi&&!isZone)continue;
for(let i=0;i<layer.length;i++){
const f=layer.feature(i),p=f.properties||{},type=f.type;
if(type===2){ctx.strokeStyle=isWater?'#0284c7':isBridge?'#0f766e':'#2563eb';ctx.lineWidth=isRoad&&/motorway|trunk|primary/.test(p.highway||'')?2.8:1.4;ctx.globalAlpha=.82}
const scale=size/(f.extent||4096),geom=f.loadGeometry();
if(type===1){ctx.fillStyle=isWater?'#0284c7':lname==='bus_stops'?'#f97316':'#9333ea';for(const ring of geom)for(const pt of ring){ctx.beginPath();ctx.arc(pt.x*scale,pt.y*scale,2.6,0,Math.PI*2);ctx.fill()}}
else{ctx.beginPath();for(const ring of geom){ring.forEach((pt,j)=>{if(!j)ctx.moveTo(pt.x*scale,pt.y*scale);else ctx.lineTo(pt.x*scale,pt.y*scale)});if(type===3)ctx.closePath()}if(type===3){ctx.fillStyle=isZone?'rgba(34,197,94,.12)':'rgba(2,132,199,.09)';ctx.fill('evenodd')}else ctx.stroke();}
}
ctx.globalAlpha=1;
}
}
function newLayer(deps){
return L.GridLayer.extend({createTile(coords,done){
const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
archive.getZxy(coords.z,coords.x,coords.y).then(async res=>{
if(res?.data){
let raw=new Uint8Array(res.data);
if(raw.length>2&&raw[0]===0x1f&&raw[1]===0x8b){
if(!('DecompressionStream' in window))throw Error('Trình duyệt không hỗ trợ giải nén GZIP cho MVT');
const stream=new Blob([raw]).stream().pipeThrough(new DecompressionStream('gzip'));
raw=new Uint8Array(await new Response(stream).arrayBuffer());
}
paint(raw,canvas,deps);
}
done(null,canvas);
}).catch(e=>{console.warn('PMTiles tile decode:',e);done(e,canvas)});
return canvas}})}
async function load(){
$('pm-reload').disabled=true;show('Đang kiểm tra PMTiles và hỗ trợ HTTP Range…');
try{
const url=configuredUrl();if(!url)throw Error('URL cấu hình không hợp lệ');
const deps=await dependencies();archive=new deps.PMTiles(url);
const h=await archive.getHeader();
if(h.tileType!==1)throw Error('Tệp không phải MVT/PBF (tileType='+h.tileType+')');
if(tileLayer)map.removeLayer(tileLayer);
const Layer=newLayer(deps);tileLayer=new Layer({tileSize:256,opacity:1,maxNativeZoom:h.maxZoom,maxZoom:21,minZoom:h.minZoom}).addTo(map);configUrl=url;
show('Đã kết nối PMTiles · zoom '+h.minZoom+'–'+h.maxZoom+'. Hiển thị bus_stops / service_zones hoặc các lớp giao thông tương thích.');
document.getElementById('dataInfo').textContent='PMTiles đã kết nối: '+url;
document.getElementById('autoLoad').checked=false;
}catch(e){
show('Chưa tải được PMTiles: '+e.message+'. Vào Settings → PMTiles / Cloudflare R2 nhập URL HTTPS tệp thật, hoặc tạo ./data/hcm-traffic.pmtiles. Dữ liệu OSM vẫn có thể tải thủ công.')}
finally{$('pm-reload').disabled=false}}
$('pm-reload').onclick=load;
$('pm-hide').onclick=()=>{if(tileLayer){map.hasLayer(tileLayer)?map.removeLayer(tileLayer):tileLayer.addTo(map);$('pm-hide').textContent=map.hasLayer(tileLayer)?'Ẩn lớp PMTiles':'Hiện lớp PMTiles'}};
window.addEventListener('traffic:settings-saved',()=>load());
await load();
})();