import { createApp } from 'vue';
import App from './App.vue';
import DevUI from 'vue-devui';
import 'vue-devui/style.css';
import '@devui-design/icons/icomoon/devui-icon.css';
import { ThemeServiceInit, galaxyTheme } from 'devui-theme';
import '@arco-design/web-vue/dist/arco.css';
import ArcoVue from '@arco-design/web-vue';

const themeService = ThemeServiceInit({ galaxyTheme }, 'galaxyTheme');
themeService.applyTheme(galaxyTheme);

const app = createApp(App);
app.use(ArcoVue);
app.use(DevUI);
app.mount('#app');
