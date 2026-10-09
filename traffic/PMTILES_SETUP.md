# PMTiles transportation overlay

Traffic GIS supports PMTiles v3 as a range-requested vector overlay on top of Vietflex Map.

## What is already working
- JS module: `traffic/pmtiles-layer.js`
- Settings field: PMTiles / Cloudflare R2 (HTTPS URL to an actual .pmtiles file)
- `traffic/data/hcm-traffic.pmtiles` is the expected local default path **but not supplied**.
- UI reports missing data; avoids claiming that a basemap is the transport feature layer.
- Overpass remains available for manual retrieval and property popups.

## Prepare real data
Run the GitHub Actions workflow `Build HCMC Traffic PMTiles`. It downloads OSM from Geofabrik, clips an *illustrative rectangle* around the city, generates GeoJSON, converts to MBTiles with Tippecanoe, then PMTiles. The workflow delivers the PMTiles artifact **only**; it does not publish to GitHub Pages or R2. Download artifact, upload to Cloudflare R2 (recommended), enable public object access, GET/HEAD/Range CORS, then enter the URL in Settings. Avoid committing very large files to Git.

The generated transport layer is named `transport`, with individual roads/points distinguished by feature attributes. The client automatically applies its standard styling to recognized `transport` layers.

### CORS
```json
[{"AllowedOrigins":["https://xulytiengviet.github.io"],"AllowedMethods":["GET","HEAD"],"AllowedHeaders":["Range","If-Range","If-None-Match"],"ExposeHeaders":["Accept-Ranges","Content-Range","Content-Length","ETag","Content-Type"],"MaxAgeSeconds":3600}]
```

## Accuracy and rights
- Streets are derived from OpenStreetMap; preserve ODbL attribution.
- OSM tagging is incomplete and not a source of real-time cameras, speed limits or certified bridge clearance.
- Do not package GrabMaps/AWS tiles or third-party proprietary maps into PMTiles without written redistribution rights.
- Clip bbox in example is not the final administrative boundary. For full post-2025 HCMC coverage, provide an authoritative polygon and refine the extraction.

## Deployment
The Pages workflow serves files from `traffic/` only. With an external R2 URL, publishing the PMTiles file to Pages is not needed. Verify HTTP 206 Partial Content for Range requests before using production.
