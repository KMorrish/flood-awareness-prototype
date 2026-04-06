# Flood Awareness Map — Brisbane Prototype

A public-facing interactive flood mapping tool built for council use, modelled on the [Hawkesbury-Nepean Valley Flood Map](https://www.ses.nsw.gov.au/hawkesbury-nepean-floods) by NSW SES.

## Features

- **Plain language flood risk communication** — "High likelihood — happens often" instead of "1% AEP"
- **Suburb search** with autocomplete for 130+ Brisbane suburbs
- **4 flood likelihood levels** with colour-coded map overlays
- **Flood source type filters** — River, Creek, Storm Tide, Overland Flow
- **Historic flood comparison** — toggle 1974, 2011, and 2022 flood extents
- **Educational "Did you know?" panel** with contextual flood information
- **Basemap toggle** — Streets / Satellite
- **Mobile responsive** design

## Technology

- [ArcGIS Maps SDK for JavaScript](https://developers.arcgis.com/javascript/latest/) (v4.30)
- Static HTML / CSS / JS — no build tools or frameworks required
- All flood data sourced from [Brisbane City Council Open Spatial Data](https://www.spatial-data.brisbane.qld.gov.au/) (public feature services)

## Data Sources

All data is publicly accessible from Brisbane City Council's ArcGIS feature services:

| Layer | Service URL |
|---|---|
| Overall Flood Risk | `Flood_Awareness_Flood_Risk_Overall/FeatureServer/0` |
| River Flooding | `Flood_Awareness_River/FeatureServer/0` |
| Creek Flooding | `Flood_Awareness_Creek/FeatureServer/0` |
| Storm Tide | `Flood_Awareness_Storm_Tide/FeatureServer/0` |
| Overland Flow | `Flood_Awareness_Overland_Flow/FeatureServer/0` |
| Historic — Feb 2022 | `Flood_Awareness_Historic_Brisbane_River_and_Creek_Floods_Feb2022/FeatureServer/0` |
| Historic — Jan 2011 | `Flood_Awareness_Historic_Brisbane_River_Floods_Jan2011/FeatureServer/0` |
| Historic — Jan 1974 | `Flood_Awareness_Historic_Brisbane_River_Floods_Jan1974/FeatureServer/0` |

Base URL: `https://services2.arcgis.com/dEKgZETqwmDAh1rP/arcgis/rest/services/`

## Deployment

This is a static site — just serve the three files:

```
index.html
styles.css
app.js
```

### GitHub Pages
This repo has GitHub Pages enabled. Visit: https://kmorrish.github.io/flood-awareness-prototype/

### Any web server
Drop the files into any web server directory, S3 bucket, or Azure Static Web App.

### ArcGIS Online
Upload as a Web App item in your AGOL organisation.

## Customisation

To adapt for a different council:
1. Replace the feature service URLs in `app.js` with the target council's flood data services
2. Update the suburb list in the autocomplete configuration
3. Update branding (header, logo, colours) in `styles.css` and `index.html`
4. Adjust the `FLOOD_RISK` field values if the council uses different classification labels

## License

This is a sales demonstration prototype by Esri Australia. Not for production use without appropriate licensing.

## Credits

- **Flood data**: Brisbane City Council
- **Basemaps & SDK**: Esri / ArcGIS
- **Reference application**: [Hawkesbury-Nepean Valley Flood Map](https://www.ses.nsw.gov.au/hawkesbury-nepean-floods) — NSW SES
