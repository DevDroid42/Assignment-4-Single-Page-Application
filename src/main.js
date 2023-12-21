import { createApp } from 'vue'
import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router';
import App from './App.vue'
import map from './map.vue'
import about from './aboutProject.vue'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {path: '/', name: 'Vue',  component: map},
        {path: '/about', name:'about', component: about}
    ]
})

createApp(App).use(router).mount('#app');