import {test} from 'node:test';
import assert from 'node:assert/strict';
import {nearestCity,type MapCity} from '../lib/map-location';
const cities:MapCity[]=[['Fairfax','VA',38.8462,-77.3064],['Richmond','VA',37.5407,-77.436]];
test('map click selects nearby city with state and rejects distant/invalid clicks',()=>{
 assert.equal(nearestCity(cities,38.85,-77.31)?.label,'Fairfax, VA');
 assert.equal(nearestCity(cities,37.54,-77.43)?.label,'Richmond, VA');
 assert.equal(nearestCity(cities,0,0),null);
 assert.equal(nearestCity(cities,NaN,0),null);
 assert.equal(nearestCity(cities,95,0),null);
});
