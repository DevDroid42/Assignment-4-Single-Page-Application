<script setup>
import { ref } from 'vue'

const props = defineProps(['item']);
let crime_url = ref('http://localhost:8000');
let display_row = ref(true);

function classifyCrime(crimeCode) {

  
    if ((100 < crimeCode && crimeCode <= 120) || crimeCode === 3100) {
        return "violent";
    } else if (300 < crimeCode && crimeCode <= 374) {
        return "violent";
    } else if (400 <= crimeCode && crimeCode <= 453) {
        return "violent";
    } else if (500 <= crimeCode && crimeCode <= 566) {
        return "property";
    } else if (600 <= crimeCode && crimeCode <= 693 && crimeCode == 100) {
        return "property";
    } else if (700 <= crimeCode && crimeCode <= 732) {
        return "property";
    } else if (810 <= crimeCode && crimeCode <= 863) {
        return "violent";
    } else if (900 <= crimeCode && crimeCode <= 982) {
        return "property";
    } else if (1400 <= crimeCode && crimeCode <= 1436) {
        return "property";
    } else{
        return "other";
    }
}

function removeIncident(){
    fetch(crime_url.value+='/remove-incident', {
        method: "DELETE",
        mode: "cors",
        cache: "no-cache",
        credentials: "same-origin",
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        redirect: "follow",
        referrerPolicy: "no-referrer",
        body: JSON.stringify({case_number: props.item.case_number})
    }).then(() => {
        display_row.value = false;
    })
}

</script>

<template>
  <tr v-if="display_row" :class="'row ' + classifyCrime(item.code)">
    <td>{{ item.case_number }}</td>
    <td>{{ item.date }}</td>
    <td>{{ item.time }}</td>
    <td>{{ item.code }}</td>
    <td>{{ item.incident }}</td>
    <td>{{ item.police_grid }}</td>
    <td>{{ item.neighborhood_name }}</td>
    <td>{{ item.block }}</td>
    <td><button type="button" class="button table-delete" @click="removeIncident">Delete</button></td>
  </tr>
</template>

