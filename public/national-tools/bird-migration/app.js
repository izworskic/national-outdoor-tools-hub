'use strict';
(function(){
  const GEOCODE='/api/national-geocode';
  const LIVE='/api/bird-migration-morning';
  const form=document.getElementById('location-form');
  const input=document.getElementById('location-input');
  const locate=document.getElementById('locate-button');
  const result=document.getElementById('result');
  const error=document.getElementById('error');
  const loading=document.getElementById('loading-note');
  const $=s=>document.querySelector(s);
  const fmt=n=>Number.isFinite(n)?new Intl.NumberFormat('en-US').format(n):'—';
  const timeFmt=iso=>{if(!iso)return '—';const d=new Date(iso);return Number.isNaN(d.getTime())?iso:d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});};

  function setLoading(on,text='Checking migration and morning weather…'){
    document.body.classList.toggle('loading',on);
    loading.textContent=text;
    form.querySelector('button[type="submit"]').disabled=on;
    locate.disabled=on;
  }
  function showError(message){error.textContent=message;error.classList.add('visible');}
  function clearError(){error.textContent='';error.classList.remove('visible');}
  function metric(id,value,small){const el=$(id);if(!el)return;el.querySelector('strong').textContent=value;const s=el.querySelector('small');if(s&&small)s.textContent=small;}

  async function json(url,options){
    const r=await fetch(url,options);
    let body={};
    try{body=await r.json();}catch{}
    if(!r.ok)throw new Error(body.error||body.detail||`Request failed (${r.status})`);
    return body;
  }

  async function geocodeQuery(q){
    return json(`${GEOCODE}?q=${encodeURIComponent(q)}`);
  }
  async function reverseGeocode(latitude,longitude){
    return json(GEOCODE,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({latitude,longitude})});
  }
  async function analyze(location){
    const params=new URLSearchParams({lat:String(location.latitude),lon:String(location.longitude),state:String(location.stateCode||'')});
    const data=await json(`${LIVE}?${params}`);
    render(location,data);
    try{localStorage.setItem('birdMigrationLastLocation',JSON.stringify({q:location.query||location.displayName||'',displayName:location.displayName||'',latitude:location.latitude,longitude:location.longitude,stateCode:location.stateCode}));}catch{}
  }

  function renderWeather(weather){
    $('#weather-summary').textContent=weather.summary||'Morning weather unavailable';
    const bits=[];
    if(Number.isFinite(weather.maxPrecip))bits.push(`precip up to ${Math.round(weather.maxPrecip)}%`);
    if(Number.isFinite(weather.maxWindMph))bits.push(`wind up to ${Math.round(weather.maxWindMph)} mph`);
    $('#weather-detail').textContent=bits.length?bits.join(' · '):'No usable hourly rain/wind summary was returned.';
    const list=$('#weather-hours');list.innerHTML='';
    (weather.periods||[]).forEach(p=>{
      const card=document.createElement('div');card.className='hour';
      const precip=Number.isFinite(p.precipitationProbability)?`${Math.round(p.precipitationProbability)}% rain`:'rain n/a';
      card.innerHTML=`<strong>${timeFmt(p.startTime)} · ${p.temperature ?? '—'}°${p.temperatureUnit||''}</strong><span>${p.shortForecast||'Forecast'} · ${p.windSpeed||'wind n/a'} ${p.windDirection||''} · ${precip}</span>`;
      list.appendChild(card);
    });
  }

  function render(location,data){
    const bird=data.birdcast||{};
    const area=data.area||{};
    const label=area.countyName?`${area.countyName} County, ${location.stateCode}`:(location.displayName||location.query||'Selected location');
    $('#location-label').textContent=label;
    $('#decision-headline').textContent=data.decision?.headline||'Migration read unavailable.';
    $('#decision-detail').textContent=data.decision?.detail||'No migration amount is being inferred.';
    const livePill=$('#live-pill');
    livePill.textContent=bird.live?'BirdCast live feed':bird.available?'BirdCast migration data':'BirdCast data unavailable';
    livePill.classList.toggle('high',Boolean(bird.live));
    const highPill=$('#high-pill');
    highPill.textContent=bird.high?'BirdCast: High migration':'BirdCast: no High label';
    highPill.classList.toggle('high',Boolean(bird.high));
    $('#region-pill').textContent=bird.regionLabel||bird.region||'Regional radar estimate';

    metric('#crossed-metric',fmt(bird.birdsCrossed),bird.starting?`since ${bird.starting}`:'regional estimate');
    metric('#flight-metric',fmt(bird.birdsInFlight),bird.recorded?`recorded ${bird.recorded}`:'live/peak estimate when available');
    metric('#direction-metric',bird.direction||'—',bird.directionName||'movement direction');
    const motion=[Number.isFinite(bird.speedMph)?`${bird.speedMph} mph`:null,Number.isFinite(bird.altitudeFt)?`${fmt(bird.altitudeFt)} ft`:null].filter(Boolean).join(' · ');
    metric('#motion-metric',motion||'—','speed · altitude');

    renderWeather(data.weather||{});
    const source=$('#birdcast-source');source.href=data.sources?.birdcast?.url||bird.sourceUrl||'https://dashboard.birdcast.org/';
    $('#source-region').textContent=area.countyName?`BirdCast county region when available: ${area.countyName} County. State-level fallback is used if needed.`:'BirdCast state-level regional estimate.';
    $('#generated-at').textContent=`Checked ${new Date(data.generatedAt||Date.now()).toLocaleString()}`;
    result.classList.add('visible');
    result.scrollIntoView({behavior:'smooth',block:'start'});
  }

  form.addEventListener('submit',async e=>{
    e.preventDefault();clearError();result.classList.remove('visible');
    const q=input.value.trim();if(q.length<2){showError('Enter a U.S. city or ZIP code.');return;}
    setLoading(true,'Finding the location…');
    try{
      const location=await geocodeQuery(q);
      setLoading(true,'Checking BirdCast migration and NWS morning weather…');
      await analyze(location);
    }catch(err){showError(err.message||'The migration check could not be completed.');}
    finally{setLoading(false);}
  });

  locate.addEventListener('click',()=>{
    clearError();result.classList.remove('visible');
    if(!navigator.geolocation){showError('This browser does not provide location access. Enter a city or ZIP instead.');return;}
    setLoading(true,'Getting your approximate location…');
    navigator.geolocation.getCurrentPosition(async pos=>{
      try{
        const location=await reverseGeocode(pos.coords.latitude,pos.coords.longitude);
        input.value=location.displayName||location.query||'';
        setLoading(true,'Checking BirdCast migration and NWS morning weather…');
        await analyze(location);
      }catch(err){showError(err.message||'The migration check could not be completed.');}
      finally{setLoading(false);}
    },err=>{setLoading(false);showError(err.code===1?'Location permission was not granted. Enter a city or ZIP instead.':'Your location could not be determined. Enter a city or ZIP instead.');},{enableHighAccuracy:false,timeout:10000,maximumAge:300000});
  });

  try{
    const saved=JSON.parse(localStorage.getItem('birdMigrationLastLocation')||'null');
    if(saved?.q)input.value=saved.q;
  }catch{}
})();
