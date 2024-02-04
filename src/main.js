import './assets/style.css'
import { createApp } from 'vue'
import App from './App.vue'
import {useRouter} from "@/route.js";

createApp(App).use(useRouter()).mount('#app')
