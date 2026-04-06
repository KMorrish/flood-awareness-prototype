/* ============================================
   BRISBANE FLOOD AWARENESS MAP — APP LOGIC
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

// Brisbane suburbs for autocomplete
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
    'esri/renderers/UniqueValueRenderer'
  ], function(Map, MapView, FeatureLayer, Basemap, Extent, SimpleFillSymbol, UniqueValueRenderer) {

    // Store references globally
    window._esriModules = { Map, MapView, FeatureLayer, Basemap, Extent, SimpleFillSymbol, UniqueValueRenderer };

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
        dockEnabled: false,
        collapseEnabled: false
      }
    });

    window._map = map;
    window._mapView = mapView;

    mapView.when(function() {
      mapReady = true;
      console.log('Map ready');
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
    title: 'Flood Risk'
  });

  map.add(currentFloodLayer);

  // Geocode suburb and zoom to it
  geocodeAndZoom(selectedSuburb, view).then(() => {
    document.getElementById('map-loading').style.display = 'none';
    document.getElementById('map-legend').style.display = 'block';
    document.getElementById('source-section').style.display = 'block';
    document.getElementById('historic-section').style.display = 'block';
  }).catch(() => {
    document.getElementById('map-loading').style.display = 'none';
    document.getElementById('map-legend').style.display = 'block';
    document.getElementById('source-section').style.display = 'block';
    document.getElementById('historic-section').style.display = 'block';
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
    thumb.src = 'https://js.arcgis.com/4.30/esri/images/basemap/streets.jpg';
    label.textContent = 'Streets';
  } else {
    window._map.basemap = 'streets-navigation-vector';
    currentBasemap = 'streets';
    thumb.src = 'https://js.arcgis.com/4.30/esri/images/basemap/satellite.jpg';
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
