'use strict';

const socket = io();

Vue.component('chat-message', {
    props: ['message', 'user'],
    template: `
    <div class="message" :class="{'owner': message.id === user.id || message.roles === 'BOOKER'}">
        <div class="message-content z-depth-1">
            {{message.name}}: {{message.text}}
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
        usersList: [],
        user: {
            name: '',
            room: '',
            roles: ''
        }
    },
    methods: {
        sendMessage() {
            const message = {
                text:   this.message,
                name:   this.user.name,
                id:     this.user.id,
                roles:  this.user.roles
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

            socket.on('users:status', user => {
                //console.log(this.usersList) // Получаем всех клиентов(список неизменный)
                console.log('Получаем пользователя')
                console.log(user)
            })

            socket.on('users:get', user => {
                console.log(user) // Получаем всех клиентов онлайн при входе в систему
            })

            socket.on('message:new', message => {
                this.messages.push(message)
                scrollToBottom(this.$refs.messages)
            })

            scrollToBottom(this.$refs.messages)
        },
        changeSoket(room) {
            this.user.room = room;

            socket.emit('join', this.user, data => {
                if (typeof data === 'string') {
                    console.error(data)
                } else {
                    this.user.id = data.userId;
                }
            })
        },
        initializeSocket() {
            socket.emit('join', this.user, data => {
                if (typeof data === 'string') {
                    console.error(data)
                } else {
                    this.user.id = data.userId;
                    socket.emit('users:get');
                    this.initializeConnection();
                }
            })
        },
        initializeRoom(data) {
            console.log(this.users)
            console.log(data)
            //this.changeSoket(data.room)
        }
    },
    created() {
        axios.post('users/get').then(response => {
            if(response.status == 200){
                this.user = response.data;
                this.initializeSocket();
            } else {
                window.location = "/"
            }
        }).catch(error => {
            console.log(error);
        })
    },
    mounted() {
        axios.post('users/list').then(response => {
            if(response.status == 200) {
                this.usersList = response.data;
            }
        }).catch(error => {
            console.log(error);
        })
    }
})

function scrollToBottom(node) {
    setTimeout(() => {
        node.scrollTop = node.scrollHeight
    })
}