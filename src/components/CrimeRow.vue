<script setup>
defineProps(['item']);

function classifyCrime(crimeCode) {

  
    if ((100 <= crimeCode && crimeCode <= 120) || crimeCode === 3100) {
        return "violent";
    } else if (300 < crimeCode && crimeCode <= 374) {
        return "violent";
    } else if (400 <= crimeCode && crimeCode <= 453) {
        return "violent";
    } else if (500 <= crimeCode && crimeCode <= 566) {
        return "property";
    } else if (600 <= crimeCode && crimeCode <= 693) {
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

</script>

<template>
  <tr :class="'row ' + classifyCrime(item.code)">
    <td>{{ item.case_number }}</td>
    <td>{{ item.date }}</td>
    <td>{{ item.time }}</td>
    <td>{{ item.code }}</td>
    <td>{{ item.incident }}</td>
    <td>{{ item.police_grid }}</td>
    <td>{{ item.neighborhood_name }}</td>
    <td>{{ item.block }}</td>
  </tr>
</template>

