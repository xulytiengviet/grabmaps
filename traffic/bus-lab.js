/* Dedicated Bus Accessibility thematic simulation, Long Ngo MIT 2026.
 * Inputs are user-provided stop coordinates; proximity is geodesic, not walking network.
 */
(()=>{'use strict';const map=window.trafficMap,root=document.getElementById('bus-lab');
if(!root||!map||!window.L)return;
root.innerHTML=`<h2>Phân tích & mô phỏng tiếp cận xe buýt</h2>
<p class="hint">Lớp chuyên đề độc lập · số liệu điểm dừng từ HTML nhập vào. Mô phỏng không phải dự báo vận tải hay độ phủ mạng đường đi bộ.</p>
<div class="stat"><div><b id="lab-stops">0</b>Điểm dừng</div><div><b id="lab-zones">0</b>Phân vùng</div><div><b id="lab-in-radius">—</b>Trong bán kính</div></div>
<label class="option"><span>Bán kính phân tích: <b id="lab-radius-label">500 m</b></span></label>
<input id="lab-radius" type="range" min="100" max="1500" step="100" value="500" style="width:100%" aria-label="Bán kính phân tích">
<label class="option"><span>Vận tốc đi bộ giả định (km/h)</span><input id="lab-speed" class="field" type="number" min="1" max="8" step=".5" value="4.5" style="width:80px"></label>
<div class="buttons"><button id="lab-select">Chọn điểm phân tích</button><button id="lab-clear" class="secondary">Xóa mô phỏng</button></div>
<div id="lab-result" class="hint" role="status" aria-live="polite">Nhập dữ liệu điểm dừng, sau đó nhấn Chọn điểm phân tích và nhấp bản đồ.</div>
<div class="buttons" style="margin-top:8px"><button id="lab-export" class="secondary">Xuất kết quả GeoJSON</button><button id="lab-chart" class="secondary">Thống kê vùng 500 m</button></div>
<div id="lab-zone-stats" class="hint"></div>`;
const $=id=>document.getElementById(id);
let stops=[],zone=null,clickMode=false,origin=null,nearest=null;
const selectedLayer=L.layerGroup().addTo(map);
const rad=()=>Number($('lab-radius').value),speed=()=>Math.max(1,Math.min(8,Number($('lab-speed').value)||4.5));
function dist(lat1,lon1,lat2,lon2){const d=Math.PI/180,a=Math.sin((lat2-lat1)*d/2)**2+Math.cos(lat1*d)*Math.cos(lat2*d)*Math.sin((lon2-lon1)*d/2)**2;return 6371008.8*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&quot;',"'":'&#39;'}[c]))}
function update(){if(!origin)return;selectedLayer.clearLayers();
const near=stops.map(s=>({s,d:dist(origin.lat,origin.lng,s[0],s[1])})).sort((a,b)=>a.d-b.d),within=near.filter(x=>x.d<=rad()),first=near[0];nearest=first||null;
L.circle([origin.lat,origin.lng],{radius:rad(),color:'#d97706',fillColor:'#fbbf24',fillOpacity:.08,weight:2}).addTo(selectedLayer);
L.circleMarker([origin.lat,origin.lng],{radius:7,weight:2,color:'#c2410c',fillColor:'#fff',fillOpacity:1}).addTo(selectedLayer);
if(first){L.polyline([[origin.lat,origin.lng],[first.s[0],first.s[1]]],{color:'#e11d48',dashArray:'5 6',weight:3}).addTo(selectedLayer);
L.circleMarker([first.s[0],first.s[1]],{radius:8,color:'#e11d48',fillColor:'#fff',fillOpacity:1}).bindPopup('Điểm gần nhất: '+esc(first.s[2])+' · '+esc(first.s[3])).addTo(selectedLayer)}
$('lab-in-radius').textContent=within.length;
$('lab-result').textContent=first?'Gần nhất: '+first.s[2]+' — '+first.d.toFixed(0)+' m. Ước tính thời gian tương đương '+(first.d/1000/speed()*60).toFixed(1)+' phút ở '+speed()+' km/h. '+within.length+' điểm trong '+rad()+' m. Khoảng cách đường thẳng, chưa tính đường đi bộ thực tế.':'Không có điểm dừng để tính toán; hãy nhập dữ liệu trước.';
}
window.addEventListener('traffic:bus500-data',e=>{stops=e.detail?.stops||[];zone=e.detail?.zoneData||null;$('lab-stops').textContent=stops.length.toLocaleString('vi');$('lab-zones').textContent=(zone?.features?.length||0).toLocaleString('vi');update()});
$('lab-radius').oninput=()=>{$('lab-radius-label').textContent=rad()+' m';update()};
$('lab-speed').oninput=update;
$('lab-select').onclick=()=>{clickMode=true;$('lab-result').textContent='Nhấp trên bản đồ để chọn điểm cần phân tích.'};
map.on('click',e=>{if(!clickMode)return;clickMode=false;origin=e.latlng;update()});
$('lab-clear').onclick=()=>{clickMode=false;origin=null;nearest=null;selectedLayer.clearLayers();$('lab-in-radius').textContent='—';$('lab-result').textContent='Đã xóa kết quả mô phỏng.'};
$('lab-chart').onclick=()=>{const feats=zone?.features;if(!feats?.length){$('lab-zone-stats').textContent='Chưa có dữ liệu phân vùng trong HTML nguồn.';return}
const total=feats.reduce((a,f)=>a+(Number(f.properties?.a)||0),0);
const approx=feats.reduce((a,f)=>a+(Number(f.properties?.a)||0)*Math.min(100,Math.max(0,Number(f.properties?.c)||0))/100,0);
const noStop=feats.filter(f=>!(Number(f.properties?.n)>0)).length;
$('lab-zone-stats').textContent='Theo dữ liệu nguồn tại bán kính 500 m: '+feats.length+' vùng; tổng diện tích ghi nhận '+total.toFixed(1)+' km²; tổng diện tích quy đổi theo tỷ lệ bao phủ nguồn ~'+approx.toFixed(1)+' km² ('+(total?approx/total*100:0).toFixed(1)+'%); '+noStop+' vùng không có điểm dừng. Đây là tổng hợp chỉ số đã có, không phải phép hợp nhất hình học lại; chưa tính lại khi đổi bán kính.';
};
$('lab-export').onclick=()=>{if(!origin||!nearest){$('lab-result').textContent='Cần phân tích một điểm trước khi xuất.';return}
const center=[origin.lng,origin.lat],dest=[nearest.s[1],nearest.s[0]];
const fc={type:'FeatureCollection',features:[{type:'Feature',properties:{type:'analysis_origin',radius_m:rad(),speed_kmh:speed(),method:'great_circle_distance'},geometry:{type:'Point',coordinates:center}},{type:'Feature',properties:{type:'nearest_stop',code:nearest.s[2],name:nearest.s[3],distance_m:+nearest.d.toFixed(1)},geometry:{type:'Point',coordinates:dest}},{type:'Feature',properties:{type:'straight_distance_not_walk_route',length_m:+nearest.d.toFixed(1)},geometry:{type:'LineString',coordinates:[center,dest]}}]};
const url=URL.createObjectURL(new Blob([JSON.stringify(fc)],{type:'application/geo+json'})),a=document.createElement('a');a.href=url;a.download='hcm-bus-accessibility-simulation.geojson';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
})();