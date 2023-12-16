<script setup>
/* global L*/
import { reactive, ref, onMounted } from 'vue'
import CrimeRow from './components/CrimeRow.vue';

let search_address = ref('');
let crime_url = ref('');
let dialog_err = ref(false);
let crimes = reactive([]);

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

    // fetch('http://localhost:8000/neighborhoods')
    // .then((response) => {
    //     return response.json();
    // })
    // .then((data) => {
    //     data.forEach((item) => {
    //         neighborhood_names.push(item.neighborhood_name)
    //     });

    // })
    // .catch((error) => {
    //     console.log('Error: ' + error);
    // })

    map.neighborhood_markers.forEach((neighborhood, index) => {
        neighborhood.marker = L.marker(neighborhood.location).addTo(map.leaflet)
            .bindPopup(`Total Crimes: {}`);
    });

    map.leaflet.setMaxBounds([[44.883658, -93.217977], [45.008206, -92.993787]]);



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


// FUNCTIONS
// Function called once user has entered REST API URL
function initializeCrimes() {
    fetch(crime_url.value)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            // Assuming the response is an array of crimes
            console.log('Data received:', data);
            crimes.splice(0, crimes.length, ...data);
        })
        .catch((error) => {
            console.error('Error fetching data:', error);
        });
}


// Function called when user presses 'OK' on dialog box
function closeDialog() {
    let dialog = document.getElementById('rest-dialog');
    let url_input = document.getElementById('dialog-url');
    if (crime_url.value !== '' && url_input.checkValidity()) {
        dialog_err.value = false;
        dialog.close();
        initializeCrimes();
    }
    else {
        dialog_err.value = true;
    }
}

//the last time that an api request was made
let call_running = false;
let last_nominatim_call = new Date();
/**
 * returns a promise with the api request. This will be limited to once every couple of seconds to prevent nominatim overload
 */
function nominatim_api_request(address) {
    return new Promise((resolve, reject) => {
        if (call_running) {
            reject("Call already in progress");
            return;
        }
        let time = Math.max(3000 - (new Date() - last_nominatim_call), 0);
        call_running = true;
        setTimeout(() => {
            last_nominatim_call = new Date();
            try {
                fetch('https://nominatim.openstreetmap.org/search?q=' + address + '&format=json&limit=1', { method: "GET" }).then((data) => {
                    resolve(data);
                })
            } catch (error) {
                reject(error);
            }
            call_running = false;
        }, time);
    });
}

function focus_on_address() {
    nominatim_api_request(search_address.value).then((response) => {
        return response.json();
    }).then(data => {
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
    }).catch((error) => {
        console.log(error);
    });
}

let selectedIncidentTypes = reactive([]);
let selectedNeighborhoods = reactive([]);
let startDate = ref('');
let endDate = ref('');
let maxIncidents = ref('');

const incidentTypes = {
    "Homicide": [100, 110, 120],
    "Robbery": [300, 311, 312, 313, 314, 321, 322, 323, 324, 331, 332, 333, 334, 341, 342, 343, 344, 351, 352, 353, 354, 361, 362, 363, 364, 371, 372, 373, 374],
    "Aggravated Assault": [400, 410, 411, 412, 420, 421, 422, 430, 431, 432, 440, 441, 442, 450, 451, 452, 453],
    "Burglary": [500, 510, 511, 513, 515, 516, 520, 521, 523, 525, 526, 530, 531, 533, 535, 536, 540, 541, 543, 545, 546, 550, 551, 553, 555, 556, 560, 561, 563, 565, 566],
    "Theft": [600, 601, 603, 611, 612, 613, 614, 621, 622, 623, 630, 631, 632, 633, 640, 641, 642, 643, 651, 652, 653, 661, 662, 663, 671, 672, 673, 681, 682, 683, 691, 692, 693],
    "Motor Vehicle Theft": [700, 710, 711, 712, 720, 721, 722, 730, 731, 732],
    "Assault": [810, 861, 862, 863],
    "Arson": [900, 901, 903, 905, 911, 913, 915, 921, 922, 923, 925, 931, 933, 941, 942, 951, 961, 971, 972, 975, 981, 982],
    "Criminal Damage to Property": [1400, 1401, 1410, 1415, 1416, 1420, 1425, 1426, 1430, 1435, 1436],
    "Narcotics": [1800, 1810, 1811, 1812, 1813, 1814, 1815, 1820, 1822, 1823, 1824, 1825, 1830, 1835, 1840, 1841, 1842, 1843, 1844, 1845, 1850, 1855, 1860, 1865, 1870, 1880, 1885],
    "Weapons": [2619],
    "Death Investigation": [3100],
    "Proactive Policing": [9954, 9959, 9986]
};
const neighborhoods = reactive([]);

fetch('http://localhost:8000/neighborhoods')
    .then((response) => {
        return response.json();
    })
    .then((data) => {
        data.forEach((item) => {
            neighborhoods.push(item);
        })
    })

function updateFilters() {
    const apiUrl = constructApiUrl();
    crime_url.value = apiUrl;
    initializeCrimes();
}

function constructApiUrl() {
    let apiUrl = 'http://localhost:8000/incidents?';

    if (selectedIncidentTypes.length > 0) {
        let codes = []
        selectedIncidentTypes.forEach((type) => {
            codes.push(incidentTypes[type]);
        })
        apiUrl += `code=${codes.join(',')}&`;
    }

    if (selectedNeighborhoods.length > 0) {
        apiUrl += `neighborhood=${selectedNeighborhoods.join(',')}&`;
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
</script>

<template>
    <div class="grid-x grid-padding-x filter-controls">
        <div class="cell large-3">
            <h2>Incident Types</h2>
            <div v-for="(codes, category) in incidentTypes" :key=category class="checkbox">
                <input type="checkbox" :id="category" :value="category" v-model="selectedIncidentTypes"
                    @change="updateFilters" />
                <label :for="category">{{ category }}</label>
            </div>
        </div>

        <div class="cell large-3">
            <h2>Neighborhoods</h2>
            <div v-for="neighborhood in neighborhoods" :key="neighborhood" class="checkbox">
                <input type="checkbox" :id="neighborhood.neighborhood_number" :value="neighborhood.neighborhood_number"
                    v-model="selectedNeighborhoods" @change="updateFilters" />
                <label :for="neighborhood">{{ neighborhood.neighborhood_name }}</label>
            </div>
        </div>

        <div class="cell large-3">
            <h2>Date Range</h2>
            <label for="startDate">Start Date:</label>
            <input type="date" id="startDate" v-model="startDate" @change="updateFilters" />

            <label for="endDate">End Date:</label>
            <input type="date" id="endDate" v-model="endDate" @change="updateFilters" />
        </div>

        <div class="cell large-3">
            <h2>Max Incidents</h2>
            <input type="number" id="maxIncidents" v-model="maxIncidents" @input="updateFilters" />
        </div>

        <div class="cell large-12">
            <button class="button" @click="updateFilters">Update</button>
        </div>
    </div>
    <dialog id="rest-dialog" open>
        <h1 class="dialog-header">St. Paul Crime REST API</h1>
        <label class="dialog-label">URL: </label>
        <input id="dialog-url" class="dialog-input" type="url" v-model="crime_url" placeholder="http://localhost:8000" />
        <p class="dialog-error" v-if="dialog_err">Error: must enter valid URL</p>
        <br />
        <button class="button" type="button" @click="closeDialog">OK</button>
    </dialog>
    <div class="grid-container grid-padding-x">
        <div class="grid-x align-stretch">
            <input id="addressDialog" class="dialog-input cell small-12 large-11" v-model="search_address"
                placeholder="2115 Summit Ave, Saint Paul, MN 55105, United States" />
            <button class="button cell small-12 large-1" type='button' @click="focus_on_address">Search</button>
        </div>
    </div>
    <div class="grid-container ">
        <div class="grid-x grid-padding-x">
            <div id="leafletmap" class="cell auto"></div>
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
            </thead>
            <tbody>
                <CrimeRow v-for="(item, index) in crimes" :item=item :key=index></CrimeRow>
            </tbody>
        </table>
    </div>
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
    font-size: 1.2rem;
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
</style>
