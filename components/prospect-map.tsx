
'use client';
import { useEffect, useRef, useState } from 'react';
import type { Map as LeafletMap, CircleMarker } from 'leaflet';
import { nearestCity, type MapCity } from '@/lib/map-location';
export default function ProspectMap({location,onSelect}:{location:string;onSelect:(location:string)=>void}) {
 const container=useRef<HTMLDivElement>(null),mapRef=useRef<LeafletMap|null>(null);
 const selectRef=useRef(onSelect);selectRef.current=onSelect;
 const [status,setStatus]=useState('Loading map…'),[failed,setFailed]=useState(false);
 useEffect(()=>{
  let disposed=false;let marker:CircleMarker|undefined;
  Promise.all([import('leaflet'),import('@/lib/us-map-cities.json')]).then(([L,data])=>{
   if(disposed||!container.current)return;
   const cities=data.default as MapCity[];
   const map=L.map(container.current,{scrollWheelZoom:false,minZoom:3,maxZoom:16}).setView([38.8462,-77.3064],8);mapRef.current=map;
   L.tileLayer(process.env.NEXT_PUBLIC_MAP_TILE_URL||'https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:process.env.NEXT_PUBLIC_MAP_ATTRIBUTION||'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).on('tileerror',()=>{if(!disposed)setStatus('Map tiles unavailable. You can still enter a location below.');}).addTo(map);
   map.on('click',(event)=>{
    const result=nearestCity(cities,event.latlng.lat,event.latlng.lng);
    marker?.remove();
    if(!result){setStatus('No indexed US city nearby. Zoom toward a city or enter your location below.');return;}
    marker=L.circleMarker([result.city[2],result.city[3]],{radius:9,color:'#ffffff',weight:3,fillColor:'#2457df',fillOpacity:1}).addTo(map);
    marker.bindTooltip(result.label,{direction:'top'}).openTooltip();
    selectRef.current(result.label);setStatus('Selected '+result.label+'. Review the location below, then search.');
   });
   setStatus('Click near a US city to select it. Drag to explore; use + / − to zoom.');
  }).catch(()=>{if(!disposed){setFailed(true);setStatus('Map unavailable. Enter your location below to continue.');}});
  return()=>{disposed=true;mapRef.current?.remove();mapRef.current=null;};
 },[]);
 return <section className="prospect-map-hero" aria-label="Explore prospecting locations"><div className="prospect-map-heading"><div><p className="eyebrow">EXPLORE YOUR NEXT MARKET</p><h2>Where will you prospect next?</h2><p>Browse the map, choose a city, then search your niche.</p></div><span className="prospect-map-location">Search location · {location}</span></div><div className="prospect-map-canvas" ref={container} tabIndex={0} aria-label="Interactive map. Use arrow keys to pan and plus or minus to zoom."/>{failed&&<div className="prospect-map-fallback">Manual search is available below.</div>}<div className="prospect-map-footer"><p role="status">{status}</p><small>Nearby city selection · <a href="https://www.geonames.org/" target="_blank" rel="noreferrer">GeoNames</a> · Manual City, State, and ZIP entry always available</small></div></section>;
}
