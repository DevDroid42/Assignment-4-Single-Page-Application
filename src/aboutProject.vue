<script>
import Ethan from '@/assets/PortraitEthan.jpg'

export default {
  data() {
    return {
      E: Ethan
    }
  }
}
</script>
<template>
  <!-- Your page content lives here -->
  <RouterLink class="button" to="/">Home</RouterLink>
  <h1 style="text-align: center">About The Project</h1>
  <div class="grid-container">
    <div class="grid-x align-justify">
      <div class="cell small-12 medium-4">
        <h2 style="text-align: center">Ethan</h2>
        <img class="align-center" :src="E" alt="picture of Ethan Honzik" />
        <div class="cell small-12 medium-8 large-8">
          <p style="text-align: center">information</p>
        </div>
      </div>

      <div class="cell small-12 medium-4">
        <h2 style="text-align: center">Tanner</h2>
        <img class="align-center" src="" alt="picture of Ethan Honzik" />
        <div class="cell small-12 medium-8 large-8">
          <p style="text-align: center">information</p>
        </div>
      </div>

      <div class="cell small-12 medium-4">
        <h2 style="text-align: center">Furaha</h2>
        <img class="align-center" src="" alt="picture of Furaha Aswan" />
        <div class="cell small-12 medium-8 large-8">
          <p style="text-align: center"></p>
        </div>
      </div>

      <div class="cell small-12 medium-5" style="background-color: rgba(128, 128, 128, 0.308);">
        <h2 style="text-align: center">Findings</h2>
        <div class="cell small-12 medium-8 large-8">
          <ul>
            <li></li>
            <li></li>
            <li></li>
            <li></li>
            <li></li>
          </ul>
        </div>
      </div>
      <div class="cell small-12 medium-5" style="background-color: rgba(128, 128, 128, 0.308);">
        <h2 style="text-align: center">Tools used</h2>
        <div class="cell small-12 medium-8 large-8">
          <ul>
            <li></li>
            <li></li>
            <li></li>
          </ul>
        </div>
      </div>

      <div class="cell small-12 medium-12">
        <h2 style="text-align: center">Video Demo</h2>
        <div class="cell small-12 medium-8 large-8">
          <p style="text-align: center"></p>
        </div>
      </div>

    </div>
  </div>
</template>