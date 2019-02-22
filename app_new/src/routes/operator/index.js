import Vue from 'vue'
import Router from 'vue-router'
import ChatPage from '../../components/operator/chat/chatPage'

Vue.use(Router)

let router = new Router({
    mode: 'history',
    routes: [
        {
            name: 'chat',
            path: '/chat',
            component: ChatPage,
            meta: { requiresAuth: true }
        }
    ]
});

export default router
