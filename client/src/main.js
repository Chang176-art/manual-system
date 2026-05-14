import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import './styles/variables.css'
import './styles/global.css'

import Icon from './components/Icon.vue'

const app = createApp(App)
app.use(ElementPlus)
app.use(router)
app.component('Icon', Icon)
app.mount('#app')
