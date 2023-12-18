<script setup>
import { ref, onMounted } from 'vue';

const name = ref('');

const props = defineProps(['item']);

onMounted(() => {
  fetch(`http://localhost:8000/neighborhoods?id=${props.item.neighborhood_number}`)
    .then((response) => response.json())
    .then((data) => {
      name.value = data.neighborhood_name;
    });
});
</script>

<template>
  <tr>
    <td>{{ item.case_number }}</td>
    <td>{{ item.date }}</td>
    <td>{{ item.time }}</td>
    <td>{{ item.code }}</td>
    <td>{{ item.incident }}</td>
    <td>{{ item.police_grid }}</td>
    <td>{{ name.value }}</td>
    <td>{{ item.block }}</td>
  </tr>
</template>
