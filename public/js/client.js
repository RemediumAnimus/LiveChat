'use strict';

const socket = io();

Vue.component('chat-message', {
    props: ['message', 'user'],
    template: `
    <div class="message" :class="{'owner': message.user.socket.id === user.id}">
        <div class="message-content z-depth-1">
            {{message.user.attributes.name}}: {{message.attributes.body}}
        </div>
    </div>
  `
})

new Vue({
    el: '#app',
    data: {
        message: '',
        messages: [],
        users: [],
        usersOnline: [],
        user: {
            name: '',
            room: '',
            roles: ''
        }
    },
    methods: {
        sendMessage() {
            const message = {
                id:     this.user.id,
                text:   this.message
            }

            socket.emit('message:create', message, err => {
                if (err) {
                    console.error(err)
                } else {
                    this.message = ''
                }
            })
        },
        initializeConnection() {
            socket.on('users:update', users => {
                this.users = [...users]
            })

            socket.on('message:new', message => {
                this.messages.push(message)
                scrollToBottom(this.$refs.messages)
            })

            scrollToBottom(this.$refs.messages)
        },
        initializeSocket() {
            socket.emit('join', this.user, data => {
                if (typeof data === 'string') {
                    console.error(data)
                } else {
                    this.user.id = data.userId;
                    this.initializeConnection();
                }
            })
        }
    },
    mounted() {
        axios.post('users/get', {}).then(response => {
            if(response.status == 200){
                this.user = response.data;
                this.initializeSocket();
            } else {
                window.location = "/"
            }
        }).catch(error => {
            console.log(error);
            alert('Указаны не валидные данные!')
        })
    }
})

function scrollToBottom(node) {
    setTimeout(() => {
        node.scrollTop = node.scrollHeight
    })
}