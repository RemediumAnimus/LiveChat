import Vue from 'vue'
import Router from 'vue-router'
import ChatPageUser from '../../components/client/chat/ChatPage'

Vue.use(Router)

let router = new Router({
    mode: 'history',
    routes: [
        {
            name: 'chat',
            path: '/chat',
            component: ChatPageUser,
            meta: { requiresAuth: true }
        }
    ]
});

export default router
