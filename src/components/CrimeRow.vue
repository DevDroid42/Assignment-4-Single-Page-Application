<script setup>
defineProps(['item'])
</script>

<template>
    <tr>
        <td>{{item.case_number}}</td>
        <td>{{item.date}}</td>
        <td>{{item.time}}</td>
        <td>{{item.code}}</td>
        <td>{{item.incident}}</td>
        <td>{{item.police_grid}}</td>
        <td>{{item.neighborhood_number}}</td>
        <td>{{item.block}}</td>
    </tr>
</template>