import Vue from 'vue'
import Router from 'vue-router'
import LoginPage from '../components/login/LoginPage'

Vue.use(Router);

let router = new Router({
    mode: 'history',
    routes: [
        {
            path: '/',
            name: 'auth',
            component: LoginPage,
            meta: { requiresAuth: true }
        }
    ]
});

export default router
