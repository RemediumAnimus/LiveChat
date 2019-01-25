'use strict';

// Connect to sockets
const socket = io();

// Define a new component
Vue.component('chat-message', {
    props: ['message', 'user'],
    template: `
    <div class="message" :class="{'owner': message.user.socket.id === user.id || message.user.roles === 'BOOKER'}">
        <div class="message-content z-depth-1">
            {{message.user.attributes.name}}: {{message.attributes.body}}
        </div>
    </div>
  `
})

// Create a new instance of Vue
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

        // Method of sending messages
        sendMessage() {

            // Body message
            const message = {
                id:     this.user.id,
                text:   this.message
            }

            // Sending a new message
            socket.emit('message:create', message, err => {
                if (err) {
                    console.error(err)
                } else {
                    this.message = ''
                }
            })
        },

        // Initialize event audition
        initializeConnection() {

            // Listen to the update event of users in the room
            socket.on('users:update', users => {
                this.users = [...users]
            })

            // Listen to the user status update event.
            socket.on('users:status', user => {
                for(let j = 0; j < this.usersList.length; j++) {
                    if(this.usersList[j].id === user.attributes.id) {
                        if(this.usersList[j].online === true){
                            this.usersList[j].online = false;
                        } else {
                            this.usersList[j].online = true;
                        }
                    }
                }
            })

            // Listen to the event of receiving a list of online users
            socket.on('users:get', user => {
                for(let i = 0; i < user.length; i++){
                    var j = this.usersList.findIndex(u => u.id === user[i].attributes.id)
                    if(j != undefined){
                        this.usersList[j].online = true;
                    }
                }
            })

            // Listen to the message receiving event
            socket.on('message:new', message => {
                this.messages.push(message)
                scrollToBottom(this.$refs.messages)
            })

            // Omit scroll to the last message
            scrollToBottom(this.$refs.messages)
        },

        // Initialize connections of the authorized user
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

        // Initialize a new dialogue with the client
        initializeRoom(data) {
            this.user.room = data.room;
            socket.emit('join', this.user, data => {
                if (typeof data === 'string') {
                    console.error(data)
                } else {
                    this.user.id = data.userId;
                }
            })
        }
    },

    // Initialize the hook after creating the instance
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

    // Initialize the hook before instantiating the instance
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