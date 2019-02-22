import Vue from 'vue'
import VueSocketio from 'vue-socket.io-extended';
import io from 'socket.io-client';
import App from './App'
import router from './routes'
import client_router from './routes/client'
import operator_router from './routes/operator'
import LoginFormOperator from './components/login/loginFormOperator'
import LoginFormClient1 from './components/login/loginFormClient1'
import LoginFormClient2 from './components/login/loginFormClient2'
import ChatPreloader from './components/operator/chat/chatPreloader'
import AssistantItem from './components/operator/chat/assistantItem'
import Search from './components/operator/chat/search'
import UsersList from './components/operator/chat/usersList'
import AssistantList from './components/operator/chat/assistantsList'
import Chat from './components/operator/chat/chat'
import Message from './components/operator/chat/message'
import InputMessage from './components/operator/chat/inputMessage'
import Attachment from './components/operator/chat/attachment'
import ImagesModal from './components/operator/chat/imagesModal'
import DocumentsModal from './components/operator/chat/documentsModal'
import ProfileFile from './components/operator/chat/profileFile'
import ProfileImage from './components/operator/chat/profileImage'


//taskmanager
import TaskmanagerModal from './components/operator/taskmanager/taskmanagerModal'
import PlannerMessage from './components/operator/taskmanager/plannerMessage'
import PlannerAttachment from './components/operator/taskmanager/plannerAttachment'
import axios from './config'

Vue.config.productionTip = false

Vue.use(VueSocketio, io('http://localhost:3001'));

Vue.component('LoginFormOperator', LoginFormOperator);
Vue.component('LoginFormClient1', LoginFormClient1);
Vue.component('LoginFormClient2', LoginFormClient2);
Vue.component('ChatPreloader', ChatPreloader);
Vue.component('AssistantItem', AssistantItem);
Vue.component('UsersList', UsersList);
Vue.component('AssistantList', AssistantList);
Vue.component('Search', Search);
Vue.component('Chat', Chat);
Vue.component('Message', Message);
Vue.component('InputMessage', InputMessage);
Vue.component('Attachment', Attachment);
Vue.component('ImagesModal', ImagesModal);
Vue.component('DocumentsModal', DocumentsModal);
Vue.component('TaskmanagerModal', TaskmanagerModal);
Vue.component('ProfileFile', ProfileFile);
Vue.component('ProfileImage', ProfileImage);
Vue.component('PlannerMessage', PlannerMessage);
Vue.component('PlannerAttachment', PlannerAttachment);

let login = document.getElementById('login');
let client = document.getElementById('client');
let operator = document.getElementById('operator');

if (login) {
    new Vue({
        el: '#login',
        router,
        components: {App},
        template: '<App/>',
    })
}

if (client) {
    let router = client_router;
    new Vue({
        el: '#client',
        router,
        components: {App},
        template: '<App/>',
    })
}

if (operator) {
    let router = operator_router;
    new Vue({
        el: '#operator',
        router,
        components: {App},
        template: '<App/>',
    })
}

