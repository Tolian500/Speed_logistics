import './assets/main.css';
import 'primeicons/primeicons.css';
import Toast from 'vue-toastification';
import 'vue-toastification/dist/index.css';
import ganttastic from '@infectoone/vue-ganttastic'

import router from './router';

import { createApp } from 'vue';
import App from './App.vue';

const app = createApp(App);

app.use(router);
app.use(ganttastic);
app.use(Toast);

app.mount('#app');
