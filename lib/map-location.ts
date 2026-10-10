export type MapCity = [name: string, state: string, latitude: number, longitude: number];
export function nearestCity(cities: MapCity[], lat: number, lng: number, maxKm = 25) {
 if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat)>90 || Math.abs(lng)>180) return null;
 const rad=Math.PI/180;
 let best:MapCity|null=null, distance=maxKm;
 for(const city of cities){
  const dLat=(city[2]-lat)*rad,dLng=(city[3]-lng)*rad;
  const a=Math.sin(dLat/2)**2+Math.cos(lat*rad)*Math.cos(city[2]*rad)*Math.sin(dLng/2)**2;
  const km=6371*2*Math.asin(Math.min(1,Math.sqrt(a)));
  if(km<distance){best=city;distance=km;}
 }
 return best?{city:best,label:best[0]+', '+best[1],distanceKm:distance}:null;
}
