/* ============================================
   FLOOD AWARENESS MAP — PROTOTYPE APP LOGIC
   ============================================ */

// ======================
// STATE
// ======================
let mapView = null;
let currentBasemap = 'streets';
let selectedSuburb = null;
let selectedRisk = null;
let currentFloodLayer = null;
let historicLayers = {};
let activeHistoric = {};
let currentSource = 'overall';
let mapReady = false;

// Service URLs
const SERVICES = {
  overall: 'https://services2.arcgis.com/dEKgZETqwmDAh1rP/arcgis/rest/services/Flood_Awareness_Flood_Risk_Overall/FeatureServer/0',
  river: 'https://services2.arcgis.com/dEKgZETqwmDAh1rP/arcgis/rest/services/Flood_Awareness_River/FeatureServer/0',
  creek: 'https://services2.arcgis.com/dEKgZETqwmDAh1rP/arcgis/rest/services/Flood_Awareness_Creek/FeatureServer/0',
  storm: 'https://services2.arcgis.com/dEKgZETqwmDAh1rP/arcgis/rest/services/Flood_Awareness_Storm_Tide/FeatureServer/0',
  overland: 'https://services2.arcgis.com/dEKgZETqwmDAh1rP/arcgis/rest/services/Flood_Awareness_Overland_Flow/FeatureServer/0'
};

const HISTORIC_SERVICES = {
  '1974': 'https://services2.arcgis.com/dEKgZETqwmDAh1rP/arcgis/rest/services/Flood_Awareness_Historic_Brisbane_River_Floods_Jan1974/FeatureServer/0',
  '2011': 'https://services2.arcgis.com/dEKgZETqwmDAh1rP/arcgis/rest/services/Flood_Awareness_Historic_Brisbane_River_Floods_Jan2011/FeatureServer/0',
  '2022': 'https://services2.arcgis.com/dEKgZETqwmDAh1rP/arcgis/rest/services/Flood_Awareness_Historic_Brisbane_River_and_Creek_Floods_Feb2022/FeatureServer/0'
};

// Flood depth by risk level (metres)
const RISK_DEPTHS = {
  'High': 4,
  'Medium': 2,
  'Low': 1,
  'Very Low': 0.5
};

// 3D view state
let sceneView3D = null;

// Brisbane Buildings service URL
const BRISBANE_BUILDINGS_URL = 'https://services1.arcgis.com/HrMiNYsSqqPpLTDE/arcgis/rest/services/Brisbane_buildings/FeatureServer/0';

// Risk colours
const RISK_COLORS = {
  'High': [123, 31, 162, 0.5],      // #7b1fa2
  'Medium': [21, 101, 192, 0.5],    // #1565c0
  'Low': [0, 137, 123, 0.5],        // #00897b
  'Very Low': [102, 187, 106, 0.5]  // #66bb6a
};

const RISK_OUTLINE = {
  'High': [123, 31, 162, 0.8],
  'Medium': [21, 101, 192, 0.8],
  'Low': [0, 137, 123, 0.8],
  'Very Low': [102, 187, 106, 0.8]
};

// Info text for each risk level
const INFO_TEXTS = {
  'default': 'Floods that happen more often are generally smaller. Floods that happen rarely can be much larger and more destructive.',
  'High': 'A high-likelihood flood has roughly a 1 in 5 chance of occurring in any given year. Over an 80-year lifetime, there is almost a 100% chance of experiencing this type of flood at least once.',
  'Medium': 'A medium-likelihood flood has roughly a 1 in 20 chance of occurring in any given year. Over an 80-year lifetime, there is about a 98% chance of experiencing this type of flood.',
  'Low': 'A low-likelihood flood has roughly a 1 in 100 chance of occurring in any given year. While uncommon, there is still about a 55% chance of experiencing one over an 80-year lifetime.',
  'Very Low': 'A very low-likelihood flood is a rare, extreme event beyond the 1 in 100 year level. While unlikely in any given year, the consequences can be catastrophic when they occur.'
};

// Suburbs for autocomplete (demo dataset)
const BRISBANE_SUBURBS = [
  'Acacia Ridge', 'Albion', 'Alderley', 'Algester', 'Annerley', 'Anstead', 'Ascot', 'Ashgrove', 'Aspley', 'Auchenflower',
  'Bald Hills', 'Balmoral', 'Banyo', 'Bardon', 'Bellbowrie', 'Belmont', 'Boondall', 'Bowen Hills', 'Bracken Ridge', 'Bridgeman Downs',
  'Brighton', 'Brookfield', 'Bulimba', 'Burbank', 'Calamvale', 'Camp Hill', 'Cannon Hill', 'Carina', 'Carina Heights',
  'Carindale', 'Carseldine', 'Chandler', 'Chapel Hill', 'Chelmer', 'Chermside', 'Chermside West', 'Chuwar',
  'Clayfield', 'Coopers Plains', 'Coorparoo', 'Corinda', 'Cornubia',
  'Darra', 'Deagon', 'Doolandella', 'Drewvale', 'Durack', 'Dutton Park',
  'Eagle Farm', 'East Brisbane', 'Enoggera', 'Everton Park',
  'Fairfield', 'Ferny Grove', 'Fig Tree Pocket', 'Fitzgibbon', 'Forest Lake', 'Fortitude Valley',
  'Gaythorne', 'Geebung', 'Gordon Park', 'Graceville', 'Grange', 'Greenslopes',
  'Hamilton', 'Hawthorne', 'Hemmant', 'Hendra', 'Herston', 'Highgate Hill', 'Holland Park', 'Holland Park West',
  'Indooroopilly', 'Inala',
  'Jamboree Heights', 'Jindalee',
  'Kangaroo Point', 'Karana Downs', 'Kedron', 'Kelvin Grove', 'Kenmore', 'Kenmore Hills', 'Keperra',
  'Kuraby',
  'Lota', 'Lutwyche', 'Lytton',
  'MacGregor', 'Manly', 'Manly West', 'Mansfield', 'Mitchelton', 'Moggill', 'Moorooka', 'Morningside',
  'Mount Coot-tha', 'Mount Gravatt', 'Mount Gravatt East', 'Mount Ommaney', 'Murarrie', 'Mylne',
  'Nathan', 'New Farm', 'Newmarket', 'Newstead', 'Norman Park', 'Northgate', 'Nudgee', 'Nudgee Beach', 'Nundah',
  'Oxley',
  'Paddington', 'Pallara', 'Parkinson', 'Petrie Terrace', 'Pinkenba', 'Pinjarra Hills', 'Pullenvale',
  'Red Hill', 'Richlands', 'Riverhills', 'Robertson', 'Rochedale', 'Rocklea', 'Runcorn',
  'Salisbury', 'Sandgate', 'Seven Hills', 'Seventeen Mile Rocks', 'Sherwood', 'Shorncliffe',
  'South Brisbane', 'Spring Hill', 'St Lucia', 'Stafford', 'Stafford Heights', 'Stones Corner', 'Stretton',
  'Sumner', 'Sunnybank', 'Sunnybank Hills',
  'Taringa', 'Tarragindi', 'Taigum', 'Tennyson', 'The Gap', 'Teneriffe', 'Tingalpa', 'Toowong',
  'Upper Brookfield', 'Upper Kedron', 'Upper Mount Gravatt',
  'Virginia',
  'Wacol', 'Wakerley', 'Wavell Heights', 'West End', 'Westlake', 'Willawong', 'Wilston', 'Windsor', 'Wishart', 'Woolloongabba', 'Wooloowin',
  'Wynnum', 'Wynnum West',
  'Yeerongpilly', 'Yeronga', 'Zillmere',
  'Brisbane City', 'CBD'
];

// ======================
// SCREEN NAVIGATION
// ======================
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(screenId);
  if (target) {
    target.classList.add('active');
    // Trigger animation
    target.style.animation = 'none';
    target.offsetHeight; // reflow
    target.style.animation = '';
  }

  // Initialize map when entering app screen
  if (screenId === 'screen-app' && !mapReady) {
    initMap();
  }

  // Handle footer visibility
  const footer = document.getElementById('site-footer');
  if (footer) {
    footer.style.display = screenId === 'screen-app' ? 'none' : '';
  }
}

// ======================
// CONDITIONS CHECKBOX
// ======================
function toggleGetStarted() {
  const cb = document.getElementById('conditions-check');
  const btn = document.getElementById('btn-get-started');
  btn.disabled = !cb.checked;
}

// ======================
// SUBURB SEARCH
// ======================
const suburbInput = document.getElementById('suburb-input');
const searchDropdown = document.getElementById('search-dropdown');
const searchClear = document.getElementById('search-clear');
let highlightIndex = -1;

if (suburbInput) {
  suburbInput.addEventListener('input', function() {
    const val = this.value.trim().toLowerCase();
    highlightIndex = -1;
    if (val.length < 1) {
      searchDropdown.classList.remove('open');
      searchDropdown.innerHTML = '';
      searchClear.style.display = 'none';
      selectedSuburb = null;
      updateShowButton();
      return;
    }
    searchClear.style.display = 'flex';
    
    const matches = BRISBANE_SUBURBS.filter(s => s.toLowerCase().includes(val)).slice(0, 8);
    if (matches.length === 0) {
      searchDropdown.innerHTML = '<div class="search-dropdown-item" style="color:var(--gray-400);cursor:default;">No suburbs found</div>';
      searchDropdown.classList.add('open');
      return;
    }

    searchDropdown.innerHTML = matches.map((m, i) => {
      const idx = m.toLowerCase().indexOf(val);
      const before = m.substring(0, idx);
      const match = m.substring(idx, idx + val.length);
      const after = m.substring(idx + val.length);
      return `<div class="search-dropdown-item" data-suburb="${m}" onclick="selectSuburb('${m}')">${before}<strong>${match}</strong>${after}</div>`;
    }).join('');
    searchDropdown.classList.add('open');
  });

  suburbInput.addEventListener('keydown', function(e) {
    const items = searchDropdown.querySelectorAll('.search-dropdown-item[data-suburb]');
    if (!items.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      highlightIndex = Math.min(highlightIndex + 1, items.length - 1);
      updateHighlight(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      highlightIndex = Math.max(highlightIndex - 1, 0);
      updateHighlight(items);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightIndex >= 0 && items[highlightIndex]) {
        selectSuburb(items[highlightIndex].dataset.suburb);
      }
    } else if (e.key === 'Escape') {
      searchDropdown.classList.remove('open');
    }
  });

  suburbInput.addEventListener('blur', function() {
    setTimeout(() => searchDropdown.classList.remove('open'), 200);
  });

  suburbInput.addEventListener('focus', function() {
    if (this.value.trim().length >= 1 && searchDropdown.innerHTML) {
      searchDropdown.classList.add('open');
    }
  });
}

function updateHighlight(items) {
  items.forEach((it, i) => {
    it.classList.toggle('highlighted', i === highlightIndex);
  });
}

function selectSuburb(name) {
  selectedSuburb = name;
  suburbInput.value = name;
  searchDropdown.classList.remove('open');
  searchClear.style.display = 'flex';
  updateShowButton();
}

function clearSuburb() {
  selectedSuburb = null;
  suburbInput.value = '';
  searchDropdown.classList.remove('open');
  searchClear.style.display = 'none';
  updateShowButton();
}

// ======================
// RADIO BUTTONS
// ======================
document.querySelectorAll('input[name="flood-risk"]').forEach(radio => {
  radio.addEventListener('change', function() {
    selectedRisk = this.value;
    updateInfoText();
    updateShowButton();
  });
});

function updateInfoText() {
  const el = document.getElementById('info-text');
  if (el) {
    el.textContent = selectedRisk ? INFO_TEXTS[selectedRisk] : INFO_TEXTS['default'];
  }
}

function updateShowButton() {
  const btn = document.getElementById('btn-show-map');
  if (btn) {
    btn.disabled = !(selectedSuburb && selectedRisk);
  }
}

// ======================
// CUSTOM MAP POPUP
// ======================
function _createCustomPopup(view) {
  // Create a custom popup overlay that sits on top of the map
  var overlay = document.createElement('div');
  overlay.id = 'custom-popup';
  overlay.style.cssText = 'display:none;position:absolute;z-index:50;pointer-events:auto;' +
    'background:#fff;border-radius:8px;box-shadow:0 4px 24px rgba(0,0,0,0.18);' +
    'padding:16px 18px 14px;min-width:220px;max-width:300px;font-family:inherit;';

  // Title
  var titleEl = document.createElement('div');
  titleEl.id = 'custom-popup-title';
  titleEl.style.cssText = 'font-weight:700;font-size:14px;color:#1a2744;margin:0 0 8px;padding-right:22px;';
  overlay.appendChild(titleEl);

  // Body
  var bodyEl = document.createElement('div');
  bodyEl.id = 'custom-popup-body';
  overlay.appendChild(bodyEl);

  // Close button
  var closeBtn = document.createElement('button');
  closeBtn.style.cssText = 'position:absolute;top:8px;right:8px;background:none;border:none;cursor:pointer;' +
    'font-size:18px;color:#697077;line-height:1;padding:2px 6px;border-radius:4px;';
  closeBtn.innerHTML = '\u00d7';
  closeBtn.addEventListener('click', function() {
    overlay.style.display = 'none';
  });
  overlay.appendChild(closeBtn);

  // Append to the mapView container
  var mapContainer = document.getElementById('mapView');
  mapContainer.style.position = 'relative';
  mapContainer.appendChild(overlay);
}

function _showCustomPopup(view, mapPoint, title, risk, depth, lat, lon) {
  var overlay = document.getElementById('custom-popup');
  if (!overlay) return;

  // Set title
  document.getElementById('custom-popup-title').textContent = title;

  // Build body
  var body = document.getElementById('custom-popup-body');
  body.innerHTML = '';
  body.style.cssText = 'font-size:13px;line-height:1.6;';

  var infoHTML = '<p style="margin:0 0 5px"><span style="font-weight:600;color:#697077">Risk level:</span> ' + risk + '</p>' +
    '<p style="margin:0 0 5px"><span style="font-weight:600;color:#697077">Indicative depth:</span> ' + depth + '</p>' +
    '<p style="margin:0 0 10px"><span style="font-weight:600;color:#697077">Location:</span> ' + lat + ', ' + lon + '</p>';
  
  var infoDiv = document.createElement('div');
  infoDiv.innerHTML = infoHTML;
  body.appendChild(infoDiv);

  // Button row
  var btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;';

  var btnStyle = 'display:inline-flex;align-items:center;gap:4px;padding:7px 14px;border-radius:5px;' +
    'font-size:12px;font-weight:600;cursor:pointer;border:none;color:#fff;transition:opacity 0.15s;';

  // Property 3D button
  var parcelBtn = document.createElement('button');
  parcelBtn.style.cssText = btnStyle + 'background:#1a2744;';
  parcelBtn.innerHTML = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">' +
    '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/></svg> Property 3D';
  parcelBtn.addEventListener('mouseenter', function() { this.style.opacity = '0.85'; });
  parcelBtn.addEventListener('mouseleave', function() { this.style.opacity = '1'; });
  parcelBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    overlay.style.display = 'none';
    openParcel3DView();
  });
  btnRow.appendChild(parcelBtn);

  // Area 3D button
  var areaBtn = document.createElement('button');
  areaBtn.style.cssText = btnStyle + 'background:#3a5a8c;';
  areaBtn.innerHTML = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">' +
    '<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg> Area 3D';
  areaBtn.addEventListener('mouseenter', function() { this.style.opacity = '0.85'; });
  areaBtn.addEventListener('mouseleave', function() { this.style.opacity = '1'; });
  areaBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    overlay.style.display = 'none';
    open3DView();
  });
  btnRow.appendChild(areaBtn);

  body.appendChild(btnRow);

  // Position the popup at the screen coordinates of the click
  var screenPoint = view.toScreen(mapPoint);
  var mapContainer = document.getElementById('mapView');
  var mapRect = mapContainer.getBoundingClientRect();

  // Offset so popup appears above click point
  var popupX = screenPoint.x - 140; // center roughly
  var popupY = screenPoint.y - 10; // slightly above

  // Keep within map bounds
  if (popupX < 10) popupX = 10;
  if (popupX + 300 > mapRect.width) popupX = mapRect.width - 310;
  if (popupY < 10) popupY = 10;

  overlay.style.left = popupX + 'px';
  overlay.style.top = popupY + 'px';
  overlay.style.display = 'block';
}

// ======================
// MAP INITIALIZATION
// ======================
function initMap() {
  require([
    'esri/Map',
    'esri/views/MapView',
    'esri/layers/FeatureLayer',
    'esri/Basemap',
    'esri/geometry/Extent',
    'esri/symbols/SimpleFillSymbol',
    'esri/renderers/UniqueValueRenderer',
    'esri/views/SceneView',
    'esri/layers/SceneLayer',
    'esri/layers/GraphicsLayer',
    'esri/Graphic',
    'esri/geometry/Polygon',
    'esri/symbols/PolygonSymbol3D',
    'esri/symbols/ExtrudeSymbol3DLayer'
  ], function(
    Map, MapView, FeatureLayer, Basemap, Extent, SimpleFillSymbol, UniqueValueRenderer,
    SceneView, SceneLayer, GraphicsLayer, Graphic, Polygon, PolygonSymbol3D, ExtrudeSymbol3DLayer
  ) {

    // Store references globally
    window._esriModules = {
      Map, MapView, FeatureLayer, Basemap, Extent, SimpleFillSymbol, UniqueValueRenderer,
      SceneView, SceneLayer, GraphicsLayer, Graphic, Polygon, PolygonSymbol3D, ExtrudeSymbol3DLayer
    };

    const map = new Map({
      basemap: 'streets-navigation-vector'
    });

    mapView = new MapView({
      container: 'mapView',
      map: map,
      center: [153.02, -27.47], // Brisbane CBD
      zoom: 12,
      constraints: {
        minZoom: 9,
        maxZoom: 18
      },
      ui: {
        components: ['zoom', 'attribution']
      },
      popup: {
        autoOpenEnabled: false
      }
    });

    window._map = map;
    window._mapView = mapView;

    mapView.when(function() {
      mapReady = true;
      console.log('Map ready');

      // Click handler: show custom popup with 3D buttons when flood data is visible
      // Using a custom HTML popup instead of ArcGIS popup (v4.30 deprecated view.popup)
      mapView.popupEnabled = false;
      _createCustomPopup(mapView);

      mapView.on('click', function(event) {
        if (!currentFloodLayer) return;

        var lon = event.mapPoint.longitude.toFixed(5);
        var lat = event.mapPoint.latitude.toFixed(5);
        var riskLabel = selectedRisk || 'Unknown';
        var depthLabel = RISK_DEPTHS[riskLabel] ? RISK_DEPTHS[riskLabel] + 'm' : '\u2014';

        // Store click point for 3D view centering
        window._lastClickPoint = [event.mapPoint.longitude, event.mapPoint.latitude];

        _showCustomPopup(mapView, event.mapPoint, selectedSuburb || 'Selected Location', riskLabel, depthLabel, lat, lon);
      });
    });
  });
}

// ======================
// SHOW ON MAP
// ======================
function showOnMap() {
  if (!selectedSuburb || !selectedRisk || !mapReady) return;

  const { FeatureLayer, SimpleFillSymbol, UniqueValueRenderer } = window._esriModules;
  const map = window._map;
  const view = window._mapView;

  // Show loading
  document.getElementById('map-loading').style.display = 'flex';
  document.getElementById('map-instruction').classList.add('hidden');

  // Remove old flood layer
  if (currentFloodLayer) {
    map.remove(currentFloodLayer);
    currentFloodLayer = null;
  }

  // Determine service URL based on source
  const serviceUrl = SERVICES[currentSource];

  // Build renderer with unique values for risk levels
  const renderer = new UniqueValueRenderer({
    field: 'FLOOD_RISK',
    defaultSymbol: new SimpleFillSymbol({
      color: [200, 200, 200, 0.3],
      outline: { color: [150, 150, 150, 0.5], width: 0.5 }
    }),
    uniqueValueInfos: Object.entries(RISK_COLORS).map(([risk, color]) => ({
      value: risk,
      symbol: new SimpleFillSymbol({
        color: color,
        outline: { color: RISK_OUTLINE[risk], width: 1 }
      }),
      label: risk
    }))
  });

  // Create feature layer with definition expression filtering by risk
  let defExpression = `FLOOD_RISK = '${selectedRisk}'`;
  
  currentFloodLayer = new FeatureLayer({
    url: serviceUrl,
    definitionExpression: defExpression,
    renderer: renderer,
    opacity: 0.7,
    title: 'Flood Risk',
    popupEnabled: false
  });

  map.add(currentFloodLayer);

  // Geocode suburb and zoom to it
  geocodeAndZoom(selectedSuburb, view).then(() => {
    document.getElementById('map-loading').style.display = 'none';
    document.getElementById('map-legend').style.display = 'block';
    document.getElementById('source-section').style.display = 'block';
    document.getElementById('historic-section').style.display = 'block';
    // Show the View in 3D button
    document.getElementById('btn-view-3d').classList.add('visible');
  }).catch(() => {
    document.getElementById('map-loading').style.display = 'none';
    document.getElementById('map-legend').style.display = 'block';
    document.getElementById('source-section').style.display = 'block';
    document.getElementById('historic-section').style.display = 'block';
    // Show the View in 3D button
    document.getElementById('btn-view-3d').classList.add('visible');
  });
}

// ======================
// GEOCODE & ZOOM
// ======================
function geocodeAndZoom(suburb, view) {
  return new Promise((resolve, reject) => {
    require(['esri/rest/locator'], function(locator) {
      locator.addressToLocations('https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer', {
        address: {
          SingleLine: suburb + ', Brisbane, QLD, Australia'
        },
        maxLocations: 1,
        outFields: ['*']
      }).then(function(results) {
        if (results && results.length > 0) {
          const loc = results[0].location;
          view.goTo({
            center: loc,
            zoom: 14
          }, { duration: 800 }).then(resolve).catch(resolve);
        } else {
          resolve();
        }
      }).catch(function(err) {
        console.warn('Geocode error:', err);
        resolve();
      });
    });
  });
}

// ======================
// BASEMAP TOGGLE
// ======================
function toggleBasemap() {
  if (!window._map) return;
  const thumb = document.getElementById('basemap-thumb');
  const label = document.getElementById('basemap-label');

  if (currentBasemap === 'streets') {
    window._map.basemap = 'satellite';
    currentBasemap = 'satellite';
    thumb.innerHTML = '<svg viewBox="0 0 48 48" width="48" height="48"><rect width="48" height="48" fill="#e8e0d8"/><path d="M0 24h48" stroke="#bbb" stroke-width="1"/><path d="M24 0v48" stroke="#bbb" stroke-width="1"/><path d="M0 12h48" stroke="#ddd" stroke-width="0.5"/><path d="M0 36h48" stroke="#ddd" stroke-width="0.5"/><path d="M12 0v48" stroke="#ddd" stroke-width="0.5"/><path d="M36 0v48" stroke="#ddd" stroke-width="0.5"/></svg>';
    label.textContent = 'Streets';
  } else {
    window._map.basemap = 'streets-navigation-vector';
    currentBasemap = 'streets';
    thumb.innerHTML = '<svg viewBox="0 0 48 48" width="48" height="48"><rect width="48" height="48" fill="#2d5016"/><rect x="0" y="0" width="24" height="24" fill="#3a6b20" opacity="0.7"/><rect x="24" y="24" width="24" height="24" fill="#4a7a30" opacity="0.6"/><circle cx="12" cy="12" r="6" fill="#5a8a40" opacity="0.5"/><path d="M0 30 Q12 20 24 28 Q36 36 48 26 L48 48 L0 48Z" fill="#1a4010" opacity="0.4"/></svg>';
    label.textContent = 'Satellite';
  }
}

// ======================
// FLOOD SOURCE TOGGLE
// ======================
function setFloodSource(source) {
  currentSource = source;
  
  // Update button states
  document.querySelectorAll('#source-toggles .toggle-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.source === source);
  });

  // Re-render if we already have a selection
  if (selectedSuburb && selectedRisk && mapReady) {
    showOnMap();
  }
}

// ======================
// HISTORIC FLOOD TOGGLE
// ======================
function toggleHistoric(year) {
  const { FeatureLayer, SimpleFillSymbol } = window._esriModules;
  const map = window._map;
  const btn = document.querySelector(`#historic-toggles .toggle-btn[data-year="${year}"]`);

  if (activeHistoric[year]) {
    // Remove layer
    map.remove(activeHistoric[year]);
    delete activeHistoric[year];
    btn.classList.remove('active');
  } else {
    // Add historic layer
    const layer = new FeatureLayer({
      url: HISTORIC_SERVICES[year],
      renderer: {
        type: 'simple',
        symbol: new SimpleFillSymbol({
          color: [239, 108, 0, 0.35],
          outline: { color: [239, 108, 0, 0.7], width: 1.5 }
        })
      },
      opacity: 0.6,
      title: 'Historic ' + year
    });

    map.add(layer);
    activeHistoric[year] = layer;
    btn.classList.add('active');
  }

  // Show/hide historic legend item
  const legendHistoric = document.getElementById('legend-historic');
  if (legendHistoric) {
    legendHistoric.style.display = Object.keys(activeHistoric).length > 0 ? 'flex' : 'none';
  }
}

// ======================
// MOBILE PANEL TOGGLE
// ======================
function togglePanel() {
  const panel = document.getElementById('panel-left');
  panel.classList.toggle('collapsed');
  
  const toggleBtn = document.getElementById('panel-toggle');
  if (panel.classList.contains('collapsed')) {
    toggleBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>';
  } else {
    toggleBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 15l-6-6-6 6"/></svg>';
  }
}

// ======================
// 3D VIEW
// ======================
function open3DView() {
  // Close any existing 2D popup
  if (window._mapView) {
    window._mapView.popup.close();
  }

  // Determine center: use last click point or current 2D view center
  var center;
  if (window._lastClickPoint) {
    center = window._lastClickPoint;
  } else if (window._mapView) {
    var c = window._mapView.center;
    center = [c.longitude, c.latitude];
  } else {
    center = [153.02, -27.47]; // Brisbane CBD fallback
  }

  // Set modal title
  var suburbText = selectedSuburb || 'Brisbane';
  var riskText = selectedRisk || 'Flood';
  document.getElementById('modal-3d-title-text').textContent = '3D Flood Visualisation — ' + suburbText;
  document.getElementById('modal-3d-subtitle').textContent =
    riskText + ' risk · ' + (RISK_DEPTHS[riskText] || 1) + 'm water depth';

  // Show modal
  var modal = document.getElementById('modal-3d');
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';

  // Show loading overlay
  document.getElementById('modal-3d-loading').classList.remove('hidden');

  // Destroy any previous SceneView to free GPU resources
  if (sceneView3D) {
    sceneView3D.destroy();
    sceneView3D = null;
  }

  // Reset container
  var container = document.getElementById('sceneViewContainer');
  container.innerHTML = '';

  // Build the scene
  build3DScene(center, riskText);
}

function build3DScene(center, risk) {
  var modules = window._esriModules;
  if (!modules || !modules.SceneView) {
    console.error('3D modules not loaded');
    return;
  }

  var {
    Map, SceneView, SceneLayer, GraphicsLayer,
    Graphic, Polygon, PolygonSymbol3D, ExtrudeSymbol3DLayer
  } = modules;

  // Depth for chosen risk level
  var waterDepth = RISK_DEPTHS[risk] || 1;

  // Create a new Map with elevation ground
  var scene3DMap = new Map({
    basemap: 'satellite',
    ground: 'world-elevation'
  });

  // OSM 3D Buildings scene layer
  var buildingsLayer = new SceneLayer({
    url: 'https://basemaps3d.arcgis.com/arcgis/rest/services/OpenStreetMap3D_Buildings_v1/SceneServer',
    title: 'Buildings'
  });
  scene3DMap.add(buildingsLayer);

  // Water surface: rectangular polygon ~500m x 500m around center
  // Degrees offset: ~500m at Brisbane latitude (27.5°S)
  // 1 degree lat ≈ 110,574m  =>  500m ≈ 0.00452°
  // 1 degree lon ≈ 98,000m   =>  500m ≈ 0.00510°
  var dLat = 0.00452;
  var dLon = 0.00510;
  var cx = center[0];
  var cy = center[1];

  var waterPolygon = new Polygon({
    rings: [[
      [cx - dLon, cy - dLat],
      [cx + dLon, cy - dLat],
      [cx + dLon, cy + dLat],
      [cx - dLon, cy + dLat],
      [cx - dLon, cy - dLat]
    ]],
    spatialReference: { wkid: 4326 }
  });

  var waterSymbol = new PolygonSymbol3D({
    symbolLayers: [
      new ExtrudeSymbol3DLayer({
        size: waterDepth,
        material: { color: [0, 120, 200, 0.35] },
        edges: {
          type: 'solid',
          color: [0, 100, 180, 0.6],
          size: 1
        }
      })
    ]
  });

  var waterGraphic = new Graphic({
    geometry: waterPolygon,
    symbol: waterSymbol
  });

  var waterLayer = new GraphicsLayer({
    title: 'Flood Water Surface',
    elevationInfo: {
      mode: 'on-the-ground'
    }
  });
  waterLayer.add(waterGraphic);
  scene3DMap.add(waterLayer);

  // Camera: position above and to the side, looking at center, tilted ~60°
  var cameraAltitude = 800;
  var cameraOffsetLon = dLon * 2.5;
  var cameraOffsetLat = -dLat * 3.0;

  sceneView3D = new SceneView({
    container: 'sceneViewContainer',
    map: scene3DMap,
    camera: {
      position: {
        longitude: cx + cameraOffsetLon,
        latitude: cy + cameraOffsetLat,
        z: cameraAltitude
      },
      tilt: 62,
      heading: 340
    },
    environment: {
      atmosphere: {
        quality: 'high'
      },
      lighting: {
        type: 'sun',
        date: new Date(),
        directShadowsEnabled: true
      }
    },
    ui: {
      components: ['zoom', 'navigation-toggle', 'compass']
    },
    qualityProfile: 'medium'
  });

  sceneView3D.when(function() {
    // Hide loading overlay once scene is ready
    document.getElementById('modal-3d-loading').classList.add('hidden');
  }, function(err) {
    console.error('SceneView error:', err);
    document.getElementById('modal-3d-loading').classList.add('hidden');
  });
}

function close3DView() {
  var modal = document.getElementById('modal-3d');
  modal.classList.remove('open');
  document.body.style.overflow = '';

  // Destroy SceneView to release GPU/memory
  if (sceneView3D) {
    sceneView3D.destroy();
    sceneView3D = null;
  }

  // Clear the container
  var container = document.getElementById('sceneViewContainer');
  container.innerHTML = '';
}

// ======================
// PARCEL-LEVEL 3D VIEW
// ======================
function openParcel3DView() {
  // Close any existing custom popup
  var customPopup = document.getElementById('custom-popup');
  if (customPopup) customPopup.style.display = 'none';

  // Determine click center
  var center;
  if (window._lastClickPoint) {
    center = window._lastClickPoint;
  } else if (window._mapView) {
    var c = window._mapView.center;
    center = [c.longitude, c.latitude];
  } else {
    center = [153.02, -27.47];
  }

  // Set modal title
  var suburbText = selectedSuburb || 'Brisbane';
  var riskText = selectedRisk || 'Flood';
  document.getElementById('modal-3d-title-text').textContent = 'Property 3D View — ' + suburbText;
  document.getElementById('modal-3d-subtitle').textContent =
    riskText + ' risk · ' + (RISK_DEPTHS[riskText] || 1) + 'm water depth · Querying buildings...';

  // Show modal
  var modal = document.getElementById('modal-3d');
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';

  // Show loading overlay
  document.getElementById('modal-3d-loading').classList.remove('hidden');

  // Destroy any previous SceneView
  if (sceneView3D) {
    sceneView3D.destroy();
    sceneView3D = null;
  }

  // Reset container
  var container = document.getElementById('sceneViewContainer');
  container.innerHTML = '';

  // Query Brisbane Buildings for the clicked point and neighbours
  queryBuildingsAndRender(center, riskText);
}

function queryBuildingsAndRender(center, risk) {
  var cx = center[0];
  var cy = center[1];

  // Step 1: Small envelope ~50m to find the clicked building
  var dSmall = 0.0005; // ~50m
  var smallEnvelope = {
    xmin: cx - dSmall,
    ymin: cy - dSmall,
    xmax: cx + dSmall,
    ymax: cy + dSmall,
    spatialReference: { wkid: 4326 }
  };

  // Step 2: Larger envelope ~250m to get neighbours
  var dLarge = 0.0025; // ~250m
  var largeEnvelope = {
    xmin: cx - dLarge,
    ymin: cy - dLarge,
    xmax: cx + dLarge,
    ymax: cy + dLarge,
    spatialReference: { wkid: 4326 }
  };

  var baseUrl = BRISBANE_BUILDINGS_URL + '/query';
  var fields = 'CLASS_NAME,MaxHeight,MinHeight,Ground,OBJECTID';

  // Query both in parallel
  var smallQuery = fetch(baseUrl + '?where=1%3D1' +
    '&geometry=' + encodeURIComponent(JSON.stringify(smallEnvelope)) +
    '&geometryType=esriGeometryEnvelope&spatialRel=esriSpatialRelIntersects' +
    '&outFields=' + fields + '&returnGeometry=true&outSR=4326&f=json'
  ).then(function(r) { return r.json(); });

  var largeQuery = fetch(baseUrl + '?where=1%3D1' +
    '&geometry=' + encodeURIComponent(JSON.stringify(largeEnvelope)) +
    '&geometryType=esriGeometryEnvelope&spatialRel=esriSpatialRelIntersects' +
    '&outFields=' + fields + '&returnGeometry=true&outSR=4326&resultRecordCount=100&f=json'
  ).then(function(r) { return r.json(); });

  Promise.all([smallQuery, largeQuery]).then(function(results) {
    var nearFeatures = results[0].features || [];
    var allFeatures = results[1].features || [];

    if (allFeatures.length === 0) {
      // No Brisbane Buildings coverage here — fall back to area 3D view
      document.getElementById('modal-3d-subtitle').textContent =
        risk + ' risk · No detailed building data at this location — showing area view';
      build3DScene(center, risk);
      return;
    }

    // Find the closest building to the click point from the small query
    var selectedOID = null;
    if (nearFeatures.length > 0) {
      // Pick the building whose centroid is closest to click
      var bestDist = Infinity;
      nearFeatures.forEach(function(f) {
        var centroid = getBuildingCentroid(f.geometry);
        var dist = Math.pow(centroid[0] - center[0], 2) + Math.pow(centroid[1] - center[1], 2);
        if (dist < bestDist) {
          bestDist = dist;
          selectedOID = f.attributes.OBJECTID;
        }
      });
    } else {
      // No building at click point — just pick closest from the large set
      var bestDist = Infinity;
      allFeatures.forEach(function(f) {
        var centroid = getBuildingCentroid(f.geometry);
        var dist = Math.pow(centroid[0] - center[0], 2) + Math.pow(centroid[1] - center[1], 2);
        if (dist < bestDist) {
          bestDist = dist;
          selectedOID = f.attributes.OBJECTID;
        }
      });
    }

    // Update subtitle with building info
    var selectedBuilding = allFeatures.find(function(f) { return f.attributes.OBJECTID === selectedOID; });
    if (selectedBuilding) {
      var height = selectedBuilding.attributes.MaxHeight;
      var ground = selectedBuilding.attributes.Ground;
      document.getElementById('modal-3d-subtitle').textContent =
        risk + ' risk · ' + (RISK_DEPTHS[risk] || 1) + 'm water depth · Building height: ' + (height ? height.toFixed(1) + 'm' : '—');
    }

    // Build the 3D parcel scene
    buildParcel3DScene(center, risk, allFeatures, selectedOID);
  }).catch(function(err) {
    console.error('Building query failed:', err);
    // Fall back to area view
    document.getElementById('modal-3d-subtitle').textContent =
      risk + ' risk · Building query failed — showing area view';
    build3DScene(center, risk);
  });
}

function getBuildingCentroid(geometry) {
  if (!geometry || !geometry.rings || !geometry.rings[0]) return [0, 0];
  var ring = geometry.rings[0];
  var sumX = 0, sumY = 0;
  for (var i = 0; i < ring.length; i++) {
    sumX += ring[i][0];
    sumY += ring[i][1];
  }
  return [sumX / ring.length, sumY / ring.length];
}

function buildParcel3DScene(center, risk, buildings, selectedOID) {
  var modules = window._esriModules;
  if (!modules || !modules.SceneView) {
    console.error('3D modules not loaded');
    return;
  }

  var {
    Map, SceneView, GraphicsLayer, Graphic, Polygon, PolygonSymbol3D, ExtrudeSymbol3DLayer
  } = modules;

  var waterDepth = RISK_DEPTHS[risk] || 1;

  // Create map
  var scene3DMap = new Map({
    basemap: 'satellite',
    ground: 'world-elevation'
  });

  // === Buildings layer ===
  var buildingGraphics = new GraphicsLayer({
    title: 'Buildings',
    elevationInfo: {
      mode: 'on-the-ground'
    }
  });

  buildings.forEach(function(feat) {
    var oid = feat.attributes.OBJECTID;
    var isSelected = (oid === selectedOID);
    var maxH = feat.attributes.MaxHeight || 10;
    var minH = feat.attributes.MinHeight || 0;
    var buildingHeight = maxH - minH;
    if (buildingHeight < 3) buildingHeight = 3; // minimum visible height

    var geom = feat.geometry;
    if (!geom || !geom.rings) return;

    var polygon = new Polygon({
      rings: geom.rings,
      spatialReference: { wkid: 4326 }
    });

    // Selected building: vibrant orange; neighbours: muted grey
    var fillColor = isSelected ? [245, 124, 0, 0.9] : [180, 185, 190, 0.6];
    var edgeColor = isSelected ? [200, 90, 0, 1.0] : [140, 145, 150, 0.5];
    var edgeSize = isSelected ? 1.5 : 0.5;

    var symbol = new PolygonSymbol3D({
      symbolLayers: [
        new ExtrudeSymbol3DLayer({
          size: buildingHeight,
          material: { color: fillColor },
          edges: {
            type: 'solid',
            color: edgeColor,
            size: edgeSize
          }
        })
      ]
    });

    var graphic = new Graphic({
      geometry: polygon,
      symbol: symbol,
      attributes: feat.attributes
    });

    buildingGraphics.add(graphic);
  });

  scene3DMap.add(buildingGraphics);

  // === Water surface ===
  var dLat = 0.003;
  var dLon = 0.0035;
  var cx = center[0];
  var cy = center[1];

  var waterPolygon = new Polygon({
    rings: [[
      [cx - dLon, cy - dLat],
      [cx + dLon, cy - dLat],
      [cx + dLon, cy + dLat],
      [cx - dLon, cy + dLat],
      [cx - dLon, cy - dLat]
    ]],
    spatialReference: { wkid: 4326 }
  });

  var waterSymbol = new PolygonSymbol3D({
    symbolLayers: [
      new ExtrudeSymbol3DLayer({
        size: waterDepth,
        material: { color: [0, 120, 200, 0.3] },
        edges: {
          type: 'solid',
          color: [0, 100, 180, 0.4],
          size: 0.5
        }
      })
    ]
  });

  var waterGraphic = new Graphic({
    geometry: waterPolygon,
    symbol: waterSymbol
  });

  var waterLayer = new GraphicsLayer({
    title: 'Flood Water',
    elevationInfo: { mode: 'on-the-ground' }
  });
  waterLayer.add(waterGraphic);
  scene3DMap.add(waterLayer);

  // === Camera: close-in view focused on selected building ===
  // Find the selected building centroid for camera target
  var camTarget = center;
  var selectedFeat = buildings.find(function(f) { return f.attributes.OBJECTID === selectedOID; });
  if (selectedFeat && selectedFeat.geometry) {
    camTarget = getBuildingCentroid(selectedFeat.geometry);
  }

  var selectedHeight = 10;
  if (selectedFeat) {
    selectedHeight = (selectedFeat.attributes.MaxHeight || 10) - (selectedFeat.attributes.MinHeight || 0);
    if (selectedHeight < 5) selectedHeight = 5;
  }

  // Camera altitude scales with building height for good framing
  var cameraAlt = Math.max(selectedHeight * 3, 150);
  var cameraOffset = 0.001; // ~100m offset

  sceneView3D = new SceneView({
    container: 'sceneViewContainer',
    map: scene3DMap,
    camera: {
      position: {
        longitude: camTarget[0] + cameraOffset,
        latitude: camTarget[1] - cameraOffset * 1.2,
        z: cameraAlt
      },
      tilt: 65,
      heading: 340
    },
    environment: {
      atmosphere: {
        quality: 'high'
      },
      lighting: {
        type: 'sun',
        date: new Date(),
        directShadowsEnabled: true
      }
    },
    ui: {
      components: ['zoom', 'navigation-toggle', 'compass']
    },
    qualityProfile: 'medium'
  });

  sceneView3D.when(function() {
    document.getElementById('modal-3d-loading').classList.add('hidden');
  }, function(err) {
    console.error('Parcel SceneView error:', err);
    document.getElementById('modal-3d-loading').classList.add('hidden');
  });
}

// Close 3D modal on Escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    var modal = document.getElementById('modal-3d');
    if (modal && modal.classList.contains('open')) {
      close3DView();
    }
  }
});

// Close 3D modal when clicking the backdrop
document.addEventListener('click', function(e) {
  var modal = document.getElementById('modal-3d');
  if (modal && modal.classList.contains('open') && e.target === modal) {
    close3DView();
  }
});
