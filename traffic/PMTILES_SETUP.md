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


## Manual R2 upload — packaged data from the 500 m bus-stop HTML

The user-supplied `hcm-traffic.pmtiles` artifact produced on 2026-10-09 contains:
- `bus_stops`: 5,875 bus stops, vector point tiles
- `service_zones`: 1,543 source coverage zones, vector polygon tiles
- Zoom levels: 8–14
- PMTiles v3, gzip-compressed MVT, approximately 2.73 MiB

**Scope:** Despite the generic filename, this file contains only the source bus stop and 500 m coverage layers; it does **not** include the complete roads, bridges, signs, real-time traffic, or official data APIs. Missing source data cannot be inferred.

Cloudflare R2: upload the file with object key `hcm-traffic.pmtiles`, enable public HTTPS access and Range/CORS, then set the exact public URL in **Settings → PMTiles / Cloudflare R2** and save. The file is not committed to the repository by this integration.

Sample CORS:
```json
[
  {
    "AllowedOrigins": ["https://xulytiengviet.github.io"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["Range", "If-Range", "If-None-Match"],
    "ExposeHeaders": ["Accept-Ranges", "Content-Range", "Content-Length", "ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Do not run the independent *Build HCMC Traffic PMTiles* workflow and assume it produces the same data: that workflow builds a different OSM transport dataset and currently uses a different classification schema.

