# Đường thủy nội địa – tích hợp bền vững (2026)

## Nguồn tham khảo
- Trang công khai: https://duongthuynoidia.tphcm.gov.vn/App/explore/?map=DUONGTHUYNOIDIA
- Bản HTML người dùng cung cấp (09/10/2026): trang ASP.NET/ExtJS, thuộc tính `VDMS_DATA.Layers`, dịch vụ AJAXPro; các CDN tương đối `/cdn/...`.
- Phát hiện trong HTML: `/cdn/vietbandomapapi/2.0.1/vietbandomapsapi.js`, `/cdn/API/VBDMapAPI.GeoJSON2.js`, `/cdn/vietbandomapapi/plugins/LayerCluster.js`, `/cdn/Libs/jsts.js`, `/cdn/ExtJS/5.1.2/ux/DrawTool/Libs/Buffer.js`, và các bộ điều khiển bản đồ.
- Ví dụ nhãn lớp: `MAP_BAOHIEU` (Báo hiệu). Đây chỉ là metadata về lớp, **không phải URL API dữ liệu có thể sử dụng**.

## Nguyên tắc kết nối
Không sao chép JavaScript sở hữu độc quyền hoặc tải dữ liệu từ endpoint nội bộ `/ajaxpro/*`, `/cdn/*` của hệ thống tham khảo. Một đường dẫn có thể xem trong View Source **không** tự động có giấy phép tái sử dụng hoặc SLA. Không đưa cookie phiên, token, credential hoặc dữ liệu hạn chế lên GitHub.

## Tính năng được triển khai
- `traffic/waterways.js` dùng Leaflet/Vietflex đã có trên trang, truy vấn OSM Overpass (phạm vi hẹp) và dựng sông/kênh/rạch, cầu bến, bến phà và thẻ seamark khi hiện diện.
- Từng lớp độc lập, bật/tắt, popup thuộc tính, xuất GeoJSON.
- Không dùng cho điều hướng tàu thuyền, phân luồng an toàn, tính độ sâu, tải trọng hoặc tĩnh không. Không có chứng cứ về độ đầy đủ của lớp báo hiệu.

## Để tích hợp dữ liệu chính thức sau này
Ưu tiên dịch vụ **có văn bản cấp phép** và tài liệu giao thức:
1. GeoJSON/OGC API Features cho điểm tuyến đa lớp.
2. OGC WMS/WMTS cho bản đồ hiển thị hoặc WFS cho lớp dữ liệu.
3. PMTiles có quyền phân phối lại khi cần CDN/R2.
4. Backend Cloudflare Worker nếu cần khóa riêng và xác thực server-side.

Cấu hình mẫu (chỉ là schema cho lần triển khai sau, chưa phải API có thật):
```json
{
  "provider": "official-waterways",
  "status": "unconnected",
  "format": "GeoJSON",
  "publicUrl": "",
  "layers": ["waterways", "ports", "navigation_signs", "restrictions"],
  "sourceLicense": "",
  "attribution": "",
  "lastVerified": null
}
```

Khi có endpoint được cấp phép, cần kiểm thử CORS, hệ tọa độ, schema thuộc tính, độ trễ, giới hạn truy vấn, quyền cache, ghi công nguồn và điều kiện sử dụng. Không suy ra tọa độ hoặc dữ liệu thực địa từ danh sách lớp `VDMS_DATA`.

Thiết kế: Long Ngo · MIT 2026 (mã nguồn **mới** do dự án phát triển; không chuyển quyền hay cấp MIT cho tài sản của đơn vị tham khảo).
