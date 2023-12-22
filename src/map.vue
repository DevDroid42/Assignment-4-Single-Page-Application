<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
/* global L*/
import { reactive, ref, onMounted } from 'vue'
import CrimeRow from './components/CrimeRow.vue'
import AboutProject from './aboutProject.vue';

const redIcon = new L.Icon({
    iconUrl: 'data/marker-icon-2x-red.png',
    shadowUrl: 'data/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

let search_address = ref('');
let crime_url = ref('http://localhost:8000');
let dialog_err = ref(false);
let crimes = ref([]);

const st_paul_bounds = {
    nw: { lat: 45.008206, lng: -93.217977 },
    se: { lat: 44.883658, lng: -92.993787 }
}

let map = reactive(
    {
        leaflet: null,
        center: {
            lat: 44.955139,
            lng: -93.102222,
            address: ''
        },
        zoom: 12,
        bounds: {
            nw: { lat: 45.008206, lng: -93.217977 },
            se: { lat: 44.883658, lng: -92.993787 }
        },
        neighborhood_markers: [
            { location: [44.942068, -93.020521], marker: null },
            { location: [44.977413, -93.025156], marker: null },
            { location: [44.931244, -93.079578], marker: null },
            { location: [44.956192, -93.060189], marker: null },
            { location: [44.978883, -93.068163], marker: null },
            { location: [44.975766, -93.113887], marker: null },
            { location: [44.959639, -93.121271], marker: null },
            { location: [44.947700, -93.128505], marker: null },
            { location: [44.930276, -93.119911], marker: null },
            { location: [44.982752, -93.147910], marker: null },
            { location: [44.963631, -93.167548], marker: null },
            { location: [44.973971, -93.197965], marker: null },
            { location: [44.949043, -93.178261], marker: null },
            { location: [44.934848, -93.176736], marker: null },
            { location: [44.913106, -93.170779], marker: null },
            { location: [44.937705, -93.136997], marker: null },
            { location: [44.949203, -93.093739], marker: null }
        ]
    }


);

// Vue callback for once <template> HTML has been added to web page
onMounted(() => {
    // Create Leaflet map (set bounds and valied zoom levels)
    map.leaflet = L.map('leafletmap').setView([map.center.lat, map.center.lng], map.zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        minZoom: 11,
        maxZoom: 18
    }).addTo(map.leaflet);

    map.neighborhood_markers.forEach((neighborhood, index) => {
        neighborhood.marker = L.marker(neighborhood.location).addTo(map.leaflet)
            .bindPopup(`Total Crimes: {}`);
    });

    map.leaflet.setMaxBounds([[44.883658, -93.217977], [45.008206, -92.993787]]);

    map.leaflet.on("move", () => {
        map.center = map.leaflet.getCenter();
    });

    map.leaflet.on("moveend", () => {
        search_address.value = "loading";
        let neighborhoodsInView = []
        map.leaflet.eachLayer((layer) => {
            if (layer instanceof L.Marker) {
                if (map.leaflet.getBounds().contains(layer.getLatLng())) {
                    map.neighborhood_markers.filter((item, index) => {
                        if (item.location[0] == layer.getLatLng().lat && item.location[1] == layer.getLatLng().lng) {
                            neighborhoodsInView.push(neighborhoods.value[index].neighborhood_number);
                        }
                    })
                }
            }
        });
        selectedNeighborhoods.value = neighborhoodsInView;
        nominatim_api_request('https://nominatim.openstreetmap.org/reverse?lat=' + map.center.lat + '&lon=' + map.center.lng + '&format=json&limit=1').then((json) => {
            search_address.value = json.display_name;
        }).catch((error) => {
            console.log(error);
        });
        updateFilters();
    });

    // Get boundaries for St. Paul neighborhoods
    let district_boundary = new L.geoJson();
    district_boundary.addTo(map.leaflet);
    fetch('data/StPaulDistrictCouncil.geojson')
        .then((response) => {
            return response.json();
        })
        .then((result) => {
            result.features.forEach((value) => {
                district_boundary.addData(value);
            });
        })
        .catch((error) => {
            console.log('Error:', error);
        });
});


// Function called when user presses 'OK' on dialog box
function closeDialog() {
    let dialog = document.getElementById('rest-dialog');
    let url_input = document.getElementById('dialog-url');
    if (crime_url.value !== '' && url_input.checkValidity()) {
        dialog_err.value = false;
        dialog.close();
        fetchCrimesFromAPI(constructApiUrl());
        fetchNeighborhoodsFromAPI();
    }
    else {
        dialog_err.value = true;
    }
}


//=========================================================
//=====================NOMINATIM CODE======================

//the last time that an api request was made
let call_running = false;
let last_nominatim_call = new Date();
/**
 * returns a promise with the api request. This will be limited to once every couple of seconds to prevent nominatim overload
 */
function nominatim_api_request(request) {
    return new Promise((resolve, reject) => {
        if (call_running) {
            reject("Call already in progress");
            return;
        }
        let time = Math.max(1100 - (new Date() - last_nominatim_call), 0);
        call_running = true;
        setTimeout(() => {
            last_nominatim_call = new Date();
            try {
                fetch(request, { method: "GET" }).then((data) => {
                    resolve(data.json());
                })
            } catch (error) {
                reject(error);
            }
            call_running = false;
        }, time);
    });
}

//focuses on address, also returns a promise to the lat,lon for other uses
function focus_on_address() {
    return new Promise((resolve, reject) => {
        nominatim_api_request('https://nominatim.openstreetmap.org/search?q=' + search_address.value + '&format=json&limit=1').then(data => {
            if (data.length == 0) {
                console.log("no address found");
                return;
            }
            let pos = [0, 0];
            pos[0] = parseFloat(data[0].lat);
            pos[1] = parseFloat(data[0].lon);
            if (pos[0] < st_paul_bounds.se.lat || pos[0] > st_paul_bounds.nw.lat || pos[1] > st_paul_bounds.se.lon || pos[1] < st_paul_bounds.nw.lon) {
                console.log("outside bounds");
                return;
            }
            let bounds = [[0, 0], [0, 0]];
            bounds[0][0] = parseFloat(data[0].boundingbox[0]);
            bounds[0][1] = parseFloat(data[0].boundingbox[3]);
            bounds[1][0] = parseFloat(data[0].boundingbox[1]);
            bounds[1][1] = parseFloat(data[0].boundingbox[2]);
            map.leaflet.flyToBounds(bounds);
            resolve(pos);
        }).catch((error) => {
            console.log(error);
            reject(error);
        });
    });
}

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
function goto_lat_lon() {
    map.center.lat = clamp(map.center.lat, st_paul_bounds.se.lat, st_paul_bounds.nw.lat);
    map.center.lng = clamp(map.center.lng, st_paul_bounds.nw.lng, st_paul_bounds.se.lng);
    let pos = [0, 0];
    pos[0] = parseFloat(map.center.lat);
    pos[1] = parseFloat(map.center.lng);
    map.leaflet.flyTo(pos);
}

//^^^^^^^^^^^^^^NOMINATIM CODE^^^^^^^^^^^^^^

//=========================================
//==============CRIME API CODE=============
function constructApiUrl() {
    let apiUrl = crime_url.value + '/incidents?';

    if (selectedIncidentTypes.length > 0) {
        let codes = []
        selectedIncidentTypes.forEach((type) => {
            codes.push(incidentTypes[type]);
        })
        apiUrl += `code=${codes.join(',')}&`;
    }

    if (selectedNeighborhoods.value.length > 0) {
        apiUrl += `neighborhood=${selectedNeighborhoods.value.join(',')}&`;
    }

    if (startDate.value) {
        apiUrl += `start_date=${startDate.value}&`;
    }

    if (endDate.value) {
        apiUrl += `end_date=${endDate.value}&`;
    }

    if (maxIncidents.value) {
        apiUrl += `limit=${maxIncidents.value}&`;
    }

    return apiUrl;
}

function fetchCrimesFromAPI(url) {
    console.log('fetchCrimesFromAPI: fetching:' + url);
    fetch(url)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            data.forEach((item) => {
                neighborhoods.value.filter((neighborhood) => {
                    if (neighborhood.neighborhood_number == item.neighborhood_number) {
                        item.neighborhood_name = neighborhood.neighborhood_name
                    }
                })
            });
            crimes.value = data;
        })
        .catch((error) => {
            console.error('Error fetching data:', error);
        });
}

function fetchNeighborhoodsFromAPI() {
    let url = crime_url.value + '/neighborhoods';
    console.log('fetchNeighborhoodsFromAPI: fetching:' + url);
    fetch(url)
        .then((response) => {
            return response.json();
        })
        .then((data) => {
            data.forEach((item) => {
                neighborhoods.value.push(item);
            })
        })
}

//^^^^^^^^^^^^^^^CRIME API CODE^^^^^^^^^^^^^^^^^^^^

//=================================================
//=============INCIDENT SELECTION==================

let selectedIncidentTypes = reactive([]);
let selectedNeighborhoods = ref([]);
let startDate = ref('');
let endDate = ref('');
let maxIncidents = ref('');

const incidentTypes = {
    "Homicide": [100, 110, 120, 3100],
    "Robbery": [311, 312, 313, 314, 321, 322, 323, 324, 331, 332, 333, 334, 341, 342, 343, 344, 351, 352, 353, 354, 361, 362, 363, 364, 371, 372, 373, 374],
    "Aggravated Assault": [400, 410, 411, 412, 420, 421, 422, 430, 431, 432, 440, 441, 442, 450, 451, 452, 453],
    "Burglary": [500, 510, 511, 513, 515, 516, 520, 521, 523, 525, 526, 530, 531, 533, 535, 536, 540, 541, 543, 545, 546, 550, 551, 553, 555, 556, 560, 561, 563, 565, 566],
    "Theft": [600, 601, 603, 611, 612, 613, 614, 621, 622, 623, 630, 631, 632, 633, 640, 641, 642, 643, 651, 652, 653, 661, 662, 663, 671, 672, 673, 681, 682, 683, 691, 692, 693],
    "Motor Vehicle Theft": [700, 710, 711, 712, 720, 721, 722, 730, 731, 732],
    "Assault": [810, 861, 862, 863],
    "Arson": [900, 901, 903, 905, 911, 913, 915, 921, 922, 923, 925, 931, 933, 941, 942, 951, 961, 971, 972, 975, 981, 982],
    "Criminal Damage to Property": [1400, 1401, 1410, 1415, 1416, 1420, 1425, 1426, 1430, 1435, 1436],
    "Narcotics": [1800, 1810, 1811, 1812, 1813, 1814, 1815, 1820, 1822, 1823, 1824, 1825, 1830, 1835, 1840, 1841, 1842, 1843, 1844, 1845, 1850, 1855, 1860, 1865, 1870, 1880, 1885],
    "Weapons": [2619],
    "Proactive Policing": [300, 9954, 9959, 9986]
};
const neighborhoods = ref([]);

fetch(crime_url.value + '/neighborhoods')
    .then((response) => {
        return response.json();
    })
    .then((data) => {
        data.forEach((item) => {
            neighborhoods.value.push(item);
        })
    })



function updateFilters() {
    fetchCrimesFromAPI(constructApiUrl());
}

function convertToValidAddress(addressWithX) {
    let sections = addressWithX.split(' ');
    sections[0] = sections[0].replaceAll('X', '0');
    let retVal = "";
    for (let i = 0; i < sections.length; i++) {
        retVal += sections[i] + " ";
    }
    return retVal.substring(0, retVal.length - 1);
}


let currMarker = L.marker([0, 0]);
function placeMarker(crime) {
    console.log(crime);
    search_address.value = convertToValidAddress(crime.block) + " St Paul Minnesota United States";
    let position = [];
    focus_on_address().then(pos => {
        if (map.leaflet.hasLayer(currMarker)) {
            map.leaflet.removeLayer(currMarker);
        }
        position = pos;
        currMarker = L.marker(position, { icon: redIcon });
        currMarker.addTo(map.leaflet).bindPopup(crime.date + "\n" + crime.time + "\n" + crime.incident);
    });
}

//^^^^^^^^^^^^^^INCIDENT SELECTION^^^^^^^^^^^^^^^^^^

//=================================================
//============INCIDENT CREATION===================


let newDate = ref('');
let newTime = ref('');
let newIncidentType = ref('');
let newIncident = ref('');
let newPoliceGrid = ref('');
let newNeighborhood = ref('');
let newBlock = ref('');
let newCode = ref('');
let newCaseNumber = ref('');

function updateNewIncident() {
    newCaseNumber.value = this.newCaseNumber;
    newCode.value = this.newCode;
    newDate.value = this.newDate;
    newTime.value = this.newTime;
    newIncidentType.value = this.newIncidentType;
    newIncident.value = this.newIncident;
    newPoliceGrid.value = this.newPoliceGrid;
    newNeighborhood.value = this.newNeighborhood;
    newBlock.value = this.newBlock;
}
function generateNewIncident() {
    if (!newCaseNumber.value || !newCode.value || !newDate.value || !newTime.value || !newIncident.value || !newPoliceGrid.value || !newNeighborhood.value || !newBlock.value) {
        let emptyFields = 1;
        console.log("Field(s) empty")
        return "Field(s) empty";

    } else {
        let emptyFields = 0;
        const response = fetch(crime_url.value + '/new-incident', {
            method: "PUT",
            mode: "cors",
            cache: "no-cache",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            redirect: "follow",
            referrerPolicy: "no-referrer",
            body: JSON.stringify({ case_number: newCaseNumber.value, date: newDate.value, time: newTime.value, code: newCode.value, incident: newIncident.value, police_grid: newPoliceGrid.value, neighborhood_number: newNeighborhood.value, block: newBlock.value }),
        }).then((response => {
            return response;
        })).catch((error) => {
            console.log('Error:', error);
        });
    }
}


//^^^^^^^^^^^^^^^^INCIDENT CREATION^^^^^^^^^^^^^^^^^^^^^^^
//Only show crimes that occurred in neighborhoods visible on the map


</script>

<template>
    <!-- <dialog id="rest-dialog" open>
        <h1 class="dialog-header">St. Paul Crime REST API</h1>
        <label class="dialog-label">URL: </label>
        <input id="dialog-url" class="dialog-input" type="url" v-model="crime_url" placeholder="http://localhost:8000" />
        <p class="dialog-error" v-if="dialog_err">Error: must enter valid URL</p>
        <br />
        <button class="button" type="button" @click="closeDialog">OK</button>
    </dialog> -->
    <RouterLink class="button" to="/about">About</RouterLink>
    <div class="grid-x">
        <div class="cell large-2">
            <div class="cell large-12">
                <h3 style="text-align: center;">Incident Type</h3>
                <div v-for="(codes, category) in incidentTypes" :key=category>
                    <input type="checkbox" :id="category" :value="category" v-model="selectedIncidentTypes" />
                    <label :for="category">{{ category }}</label>
                </div>
            </div>

            <div class="cell large-12">
                <h3 style="text-align: center;">Neighborhood Names</h3>
                <div class="cell small-12 medium-6 large-4" v-for="neighborhood in neighborhoods" :key="neighborhood">
                    <input type="checkbox" :id="neighborhood.neighborhood_number" :value="neighborhood.neighborhood_number"
                        v-model="selectedNeighborhoods" />
                    <label :for="neighborhood.neighborhood_number">{{ neighborhood.neighborhood_name }}</label>
                </div>
            </div>

            <div class="cell large-12">
                <h3 style="text-align: center;">Date Range</h3>
                <div class="cell medium-6">
                    <label for="startDate">Start Date:</label>
                    <input type="date" id="startDate" v-model="startDate" />
                </div>
                <div class="cell medium-6">
                    <label for="endDate">End Date:</label>
                    <input type="date" id="endDate" v-model="endDate" />
                </div>
            </div>

            <!-- If there is a requirement for Time Range, you can add similar structure to Date Range. -->

            <div class="cell large-12">
                <h3 style="text-align: center;">Max Incidents</h3>
                <input type="number" id="maxIncidents" v-model="maxIncidents" />
            </div>

            <div class="cell large-12">
                <button class="button" @click="updateFilters">Update</button>
            </div>

        </div>
        <div class="cell large-10 small-12">
            <div class="cell large-12" style="background-color: rgba(166, 166, 166, 0.281);">
                <template v-if="generateNewIncident">
                    <div class="grid-x grid-padding-x">
                        <h4 class="cell large-12" style="text-align: center;">Submit New Incident</h4>
                        <div class="cell small-12 medium-6 large-3">
                            <label for="newCaseNumber">Case Number</label>
                            <input type='text' id="newCaseNumber" v-model="newCaseNumber" />
                        </div>
                        <div class="cell small-12 medium-6 large-3">
                            <label for="newDate">Date</label>
                            <input type="date" id="newDate" v-model="newDate" />
                        </div>

                        <div class="cell small-12 medium-6 large-3">
                            <label for="newTime">Time</label>
                            <input type="time" id="newTime" v-model="newTime" />
                        </div>

                        <div class="cell small-12 medium-6 large-3">
                            <label for="newCode">Code</label>
                            <input type='number' id="newCode" v-model="newCode" />
                        </div>

                        <div class="cell small-12 medium-6 large-3">
                            <label for="newIncident">Incident</label>
                            <input type='text' id="newIncident" v-model="newIncident" />
                        </div>

                        <div class="cell small-12 medium-6 large-3">
                            <label for="newPoliceGrid">Police Grid</label>
                            <input type="number" id="newPoliceGrid" v-model="newPoliceGrid" />
                        </div>

                        <div class="cell small-12 medium-6 large-3">
                            <label for="newNeighborhood">Neighborhood</label>
                            <input type="number" id="newNeighborhood" v-model="newNeighborhood" />
                        </div>

                        <div class="cell small-12 medium-6 large-3">
                            <label for="newBlock">Block</label>
                            <input type='text' id="newBlock" v-model="newBlock" @input="updateNewIncident" />
                        </div>

                        <p class="cell large-6" v-if="emptyFields = 1">Field(s) are empty!</p>
                        <button class="button cell large-6" type="button" @click="generateNewIncident">Submit</button>
                    </div>

                   

                </template>
            </div>
            <div class="grid-x align-justify">
                <h4 class="cell small-12 large-12" style="text-align: center;">
                    Address
                </h4>
                <input id="addressDialog" class="cell small-12 large-11" v-model="search_address"
                    placeholder="2115 Summit Ave, Saint Paul, MN 55105, United States" />
                <button class="button cell small-12 large-1" type='button' @click="focus_on_address">Search</button>

                <h4 class="cell small-12 large-12" style="text-align: center;">Geo
                    Location</h4>
                <label class="label cell small-2 large-2">latitude</label>
                <input id="latitude" class="cell small-10 large-3" v-model="map.center.lat" placeholder="lat" />
                <label class="label cell small-2 large-2">longitude</label>
                <input id="longitude" class="cell small-10 large-3" v-model="map.center.lng" placeholder="lat" />
                <button class="button cell small-12 large-1" type='button' @click="goto_lat_lon">Go</button>
            </div>
            <div class="grid-x">
                <div id="leafletmap" class="cell large-11 small-12"></div>
                <div class="legend cell large-1">
                    <h3>Legend:</h3>
                    <div class="legend-item">
                        <span class="icon violent"></span>
                        <label>Violent</label>
                    </div>
                    <div class="legend-item">
                        <span class="icon property"></span>
                        <label>Property</label>
                    </div>
                    <div class="legend-item">
                        <span class="icon other"></span>
                        <label>Other</label>
                    </div>
                </div>
            </div>

            <table class="crime-table">
                <thead>
                    <th>Case Number</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Incident Type</th>
                    <th>Incident</th>
                    <th>Police Grid</th>
                    <th>Neighborhood</th>
                    <th>Block</th>
                    <th></th>
                </thead>
                <tbody>
                    <CrimeRow v-for="(crime, index) in crimes" :item=crime :key=index @click="placeMarker(crime)">
                    </CrimeRow>
                </tbody>
            </table>
        </div>
    </div>


    <a href="/aboutTheProject">/aboutTheProject</a>
</template>

<style>
#rest-dialog {
    width: 20rem;
    margin-top: 1rem;
    z-index: 1000;
}

#leafletmap {
    height: 500px;
}

.dialog-header {
    font-size: 1rem;
    font-weight: bold;
}

.dialog-label {
    font-size: 1rem;
}

.dialog-input {
    font-size: 1rem;
    width: 100%;
}

.dialog-error {
    font-size: 1rem;
    color: #D32323;
}

.checkbox label {
    margin-left: 0.5rem;
}

.button {
    width: 100%;
    margin: auto;
}

label {
    text-align: center;
}

input[type="date"],
input[type="text"] {
    width: 100%;
    padding: .5rem;
    border: 1px solid #ccc;
    border-radius: 0;
}

input[type="checkbox"] {
    margin-right: 0.5rem;
    margin-left: 0.5rem;
}

h4 {
    font-size: 1.3rem;
    margin: 0;
    margin-top: 0.5rem;
    background-color: rgb(145, 195, 228);
    color: black;
}
</style>
