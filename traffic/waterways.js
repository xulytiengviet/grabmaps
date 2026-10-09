/* Inland waterways module – independent, open-data implementation. MIT 2026. */
(()=>{'use strict';
const map=window.trafficMap,el=document.getElementById('waterway-panel');
if(!map||!el||!window.L)return;
el.innerHTML='<h2>Đường thủy nội địa</h2><p class="hint">Lớp tham khảo OpenStreetMap. Chưa kết nối cơ sở dữ liệu chuyên ngành TP.HCM.</p><label class="option"><span>Đường sông / kênh rạch</span><input id="water-lines" type="checkbox" checked></label><label class="option"><span>Bến cảng, bến thủy</span><input id="water-ports" type="checkbox" checked></label><label class="option"><span>Báo hiệu đường thủy (OSM có gắn thẻ)</span><input id="water-signs" type="checkbox" checked></label><div class="buttons"><button id="water-load">Tải lớp đường thủy</button><button id="water-export" class="secondary">Xuất GeoJSON</button></div><div class="hint" id="water-status" aria-live="polite">Chưa tải dữ liệu · Chọn khu vực nhỏ và nhấn Tải lớp đường thủy.</div><p class="hint">Nguồn OSM không thay thế hải đồ, luồng được công bố, hành lang an toàn, tĩnh không hoặc thông báo hàng hải chính thức.</p>';
const $=id=>document.getElementById(id),state=t=>$('water-status').textContent=t;
const layers={lines:L.layerGroup().addTo(map),ports:L.layerGroup().addTo(map),signs:L.layerGroup().addTo(map)};
const features=[];
for(const key of Object.keys(layers))$('water-'+key).onchange=e=>e.target.checked?layers[key].addTo(map):map.removeLayer(layers[key]);
function safe(s){return String(s??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]))}
function popup(tags){const keys=['name','waterway','ship','boat','maxheight','maxdepth','maxwidth','operator','seamark:type','seamark:name','source'];return '<b>'+safe(tags.name||'Đối tượng đường thủy')+'</b><table>'+keys.filter(k=>tags[k]!=null).map(k=>'<tr><td>'+safe(k)+'</td><td>'+safe(tags[k])+'</td></tr>').join('')+'</table><small>Nguồn: OpenStreetMap · thông tin chưa kiểm định điều hướng</small>'}
function add(k,type,coordinates,tags,id){features.push({type:'Feature',geometry:{type,coordinates},properties:{...tags,_layer:'water_'+k,_osm_id:id}});
const color=k==='lines'?'#0284c7':k==='ports'?'#0d9488':'#e11d48';
if(type==='LineString')L.polyline(coordinates.map(x=>[x[1],x[0]]),{color,weight:3,opacity:.9}).bindPopup(popup(tags)).addTo(layers[k]);
else L.circleMarker([coordinates[1],coordinates[0]],{color,fillColor:color,fillOpacity:.9,radius:5,weight:1}).bindPopup(popup(tags)).addTo(layers[k])}
$('water-load').onclick=async()=>{
const b=map.getBounds(),center=b.getCenter();let s=b.getSouth(),n=b.getNorth(),w=b.getWest(),e=b.getEast();
const area=(n-s)*(e-w);if(area>.005){const f=Math.sqrt(.005/area);const dy=(n-s)*f/2,dx=(e-w)*f/2;s=center.lat-dy;n=center.lat+dy;w=center.lng-dx;e=center.lng+dx}
const bbox=[s,w,n,e].map(v=>v.toFixed(6)).join(',');
const query='[out:json][timeout:35];(way["waterway"~"river|canal|stream|fairway"]('+bbox+');way["man_made"="pier"]('+bbox+');node["waterway"~"dock|riverbank|waterfall"]('+bbox+');node["seamark:type"]('+bbox+');node["harbour"]('+bbox+');node["amenity"="ferry_terminal"]('+bbox+');way["amenity"="ferry_terminal"]('+bbox+'););out body;>;out skel qt;';
$('water-load').disabled=true;state('Đang truy vấn OpenStreetMap…');
let json=null,error=null;
for(const url of ['https://overpass.kumi.systems/api/interpreter','https://overpass-api.de/api/interpreter']){
const controller=new AbortController(),tm=setTimeout(()=>controller.abort(),16000);
try{const res=await fetch(url,{method:'POST',body:new URLSearchParams({data:query}),signal:controller.signal});if(!res.ok)throw Error('HTTP '+res.status);json=await res.json();break}catch(err){error=err}finally{clearTimeout(tm)}}
if(!json){state('Không tải được dữ liệu: '+(error?.message||'Nguồn không phản hồi'));$('water-load').disabled=false;return}
for(const layer of Object.values(layers))layer.clearLayers();features.length=0;
const nodes=new Map(json.elements.filter(x=>x.type==='node').map(x=>[x.id,x]));
for(const x of json.elements){const t=x.tags||{};if(x.type==='way'&&x.nodes){
const pts=x.nodes.map(id=>nodes.get(id)).filter(Boolean).map(o=>[o.lon,o.lat]);if(pts.length<2)continue;
if(t.waterway)add('lines','LineString',pts,t,'way/'+x.id);
else if(t.man_made==='pier'||t.amenity==='ferry_terminal')add('ports','LineString',pts,t,'way/'+x.id);
}else if(x.type==='node'&&Object.keys(t).length){const k=t['seamark:type']?'signs':'ports';if(t['seamark:type']||t.harbour||t.amenity==='ferry_terminal'||t.waterway==='dock')add(k,'Point',[x.lon,x.lat],t,'node/'+x.id)}}
state('Đã tải '+features.length+' đối tượng đường thủy theo khung nhìn · nhấn vào đối tượng để xem thuộc tính.');$('water-load').disabled=false;
};
$('water-export').onclick=()=>{if(!features.length){state('Chưa có dữ liệu đường thủy để xuất.');return}
const blob=new Blob([JSON.stringify({type:'FeatureCollection',features})],{type:'application/geo+json'});
const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='hcm-inland-waterways-osm.geojson';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
})();