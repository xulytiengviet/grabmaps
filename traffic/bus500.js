/* Bus-stop 500 m extension for HCMC Traffic GIS. Data comes from user-supplied HTML, not generated. */
(()=>{'use strict';
const host=document.getElementById('bus500-panel'), map=window.trafficMap;
if(!host||!map||!window.L)return;
const root=host;
root.innerHTML='<h2>Điểm dừng xe buýt · vùng phục vụ 500 m</h2><p class="hint">Nhập tệp <b>ban_do_diem_dung_500m_zone.html</b> một lần. Dữ liệu sẽ được lưu riêng trong trình duyệt và tải lại ở lần mở sau.</p><input type="file" id="bus500-file" accept=".html,.htm" class="field" aria-label="Nhập bản đồ điểm dừng 500 mét"><div class="buttons"><button id="bus500-clear" class="secondary">Xóa dữ liệu lưu</button><button id="bus500-fit" class="secondary">Xem toàn bộ điểm</button></div><label class="option"><span>Điểm dừng</span><input id="bus500-show" type="checkbox" checked></label><label class="option"><span>Phạm vi phục vụ 500 m</span><input id="bus500-buffers" type="checkbox"></label><label class="option"><span>Phân vùng / độ phủ 500 m</span><input id="bus500-zones" type="checkbox"></label><input id="bus500-search" class="field" placeholder="Tìm mã hoặc tên điểm dừng..." aria-label="Tìm điểm dừng"><div id="bus500-results" style="max-height:180px;overflow:auto"></div><div id="bus500-summary" class="hint">Chưa có bộ dữ liệu điểm dừng. Nguồn: tệp HTML được nhập.</div>';
const $=id=>document.getElementById(id), pts=L.layerGroup().addTo(map),buffers=L.layerGroup(),zones=L.layerGroup();
const renderer=L.canvas({padding:.3}),regional={'TP.HCM (cũ)':'#1f6feb','Bình Dương (cũ)':'#d9480f','Bà Rịa – Vũng Tàu (cũ)':'#2b8a3e'};
let stops=[],zoneData=null,markers=[],savedStats=null;
function extract(txt,key){
const start=txt.search(new RegExp('\\bconst\\s+'+key+'\\s*='));if(start<0)return null;
const eq=txt.indexOf('=',start),at=txt.slice(eq+1).search(/[\[{]/)+eq+1;
if(at<eq)return null;
let depth=0,quoted=false,escape=false;
for(let i=at;i<txt.length;i++){const ch=txt[i];if(quoted){if(escape)escape=false;else if(ch==='\\')escape=true;else if(ch==='"')quoted=false;continue}
if(ch==='"'){quoted=true;continue}if(ch==='['||ch==='{')depth++;if(ch===']'||ch==='}')depth--;if(depth===0)return JSON.parse(txt.slice(at,i+1));}return null}
function db(){return new Promise((resolve,reject)=>{const request=indexedDB.open('hcm-traffic-bus500',1);request.onupgradeneeded=()=>request.result.createObjectStore('data');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})}
async function stored(mode,value){const d=await db();return new Promise((resolve,reject)=>{const tx=d.transaction('data',mode==='get'?'readonly':'readwrite'),os=tx.objectStore('data');const r=mode==='get'?os.get('bus500'):mode==='set'?os.put(value,'bus500'):os.delete('bus500');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);tx.oncomplete=()=>d.close()})}
function esc(t){return String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]))}
function render(){
pts.clearLayers();buffers.clearLayers();zones.clearLayers();markers=[];
const bounds=[];
stops.forEach((s,i)=>{if(!Array.isArray(s)||!Number.isFinite(s[0])||!Number.isFinite(s[1]))return;
const [lat,lng,code,name,address,region]=s,color=regional[region]||'#457b9d';
const popup='<strong>'+esc(code)+'</strong> · '+esc(name)+'<br>'+esc(address)+'<br>'+esc(region)+'<br>Phạm vi 500 m tính theo khoảng cách thẳng, không phải khoảng đi bộ.';
const p=L.circleMarker([lat,lng],{radius:4,color:'#fff',weight:.7,fillColor:color,fillOpacity:.95,renderer}).bindPopup(popup);pts.addLayer(p);markers.push({code:String(code||''),name:String(name||''),p,lat,lng});
buffers.addLayer(L.circle([lat,lng],{radius:500,color,weight:.4,fillColor:color,fillOpacity:.035,interactive:false,renderer}));
bounds.push([lat,lng])});
if(zoneData&&zoneData.type==='FeatureCollection')L.geoJSON(zoneData,{style:f=>({color:'#56697b',weight:.5,fillColor:f.properties?.c==null?'#ddd':f.properties.c>=75?'#22a06b':f.properties.c>=25?'#f5b841':'#f1745e',fillOpacity:.35}),onEachFeature:(f,l)=>l.bindPopup('Zone '+esc(f.properties?.z)+' · '+esc(f.properties?.nm)+'<br>Điểm dừng: '+esc(f.properties?.n)+' · Độ phủ 500 m: '+esc(f.properties?.c)+'%')}).addTo(zones);
sync();$('bus500-summary').textContent='Đã nạp '+markers.length.toLocaleString('vi')+' điểm dừng'+(zoneData?' và '+zoneData.features.length.toLocaleString('vi')+' phân vùng.':'.')+' Vòng đệm 500 m tính theo khoảng cách thẳng; không phải thời gian hay mạng đường đi bộ.';
$('bus500-fit').onclick=()=>{if(bounds.length)map.fitBounds(bounds,{padding:[20,20],maxZoom:12})};
}
function sync(){[['bus500-show',pts],['bus500-buffers',buffers],['bus500-zones',zones]].forEach(([id,g])=>$(id).checked?g.addTo(map):map.removeLayer(g))}
['bus500-show','bus500-buffers','bus500-zones'].forEach(id=>$(id).onchange=sync);
$('bus500-search').oninput=()=>{const q=$('bus500-search').value.trim().toLocaleLowerCase('vi'),out=$('bus500-results');out.replaceChildren();if(q.length<2)return;markers.filter(o=>o.code.toLocaleLowerCase('vi').includes(q)||o.name.toLocaleLowerCase('vi').includes(q)).slice(0,30).forEach(o=>{const btn=document.createElement('button');btn.className='secondary';btn.style='display:block;margin:4px 0;width:100%;text-align:left';btn.textContent=o.code+' · '+o.name;btn.onclick=()=>{map.setView([o.lat,o.lng],16);$('bus500-show').checked=true;sync();o.p.openPopup()};out.append(btn)})};
$('bus500-file').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;$('bus500-summary').textContent='Đang đọc và chuyển dữ liệu…';try{const t=await f.text(),s=extract(t,'S'),z=extract(t,'Z');if(!Array.isArray(s)||!s.length||!s.every(x=>Array.isArray(x)&&x.length>=5))throw Error('Không thấy mảng điểm dừng S trong HTML');stops=s;zoneData=z;await stored('set',{stops,zoneData});render()}catch(err){$('bus500-summary').textContent='Không nhập được dữ liệu: '+err.message}};
$('bus500-clear').onclick=async()=>{try{await stored('delete')}catch(_){}stops=[];zoneData=null;render();$('bus500-file').value='';$('bus500-summary').textContent='Đã xóa dữ liệu điểm dừng khỏi trình duyệt.'};
stored('get').then(v=>{if(v?.stops){stops=v.stops;zoneData=v.zoneData;render()}}).catch(()=>{$('bus500-summary').textContent='Trình duyệt không hỗ trợ lưu IndexedDB; vẫn có thể nhập HTML cho phiên hiện tại.'});
})();