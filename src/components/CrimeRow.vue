<script setup>
defineProps(['item']);
</script>

<template>
  <tr class="row">
    <td>{{ item.case_number }}</td>
    <td>{{ item.date }}</td>
    <td>{{ item.time }}</td>
    <td>{{ item.code }}</td>
    <td>{{ item.incident }}</td>
    <td>{{ item.police_grid }}</td>
    <td>{{item.neighborhood_name}}</td>
    <td>{{ item.block }}</td>
  </tr>
</template>
