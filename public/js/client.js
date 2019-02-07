'use strict';

/**
 * TITLE        : Socket.io method
 * DESCRIPTION  : Connect to sockets
 *
 */
const socket = io();

/**
 * TITLE        : New Vue
 * DESCRIPTION  : Create a new instance of Vue
 *
 */
new Vue({
    el: '#app',
    data: {
        message     : '',
        messages    : [],
        user        : {},
        users       : [],
        usersOnline : [],
        uploads : []
    },
    methods: {

        /**
         * TITLE        : Message method
         * DESCRIPTION  : Method of sending messages
         *
         */
        sendMessage() {
            const text = {
                text: this.message,
                type: 'text'
            };

            this.uploads.push(text);

            // Body message
            const message = {
                id          : this.user.id,
                text        : this.message,
                messages    : this.uploads,
            }

            socket.emit('message:create', message, err => {
                if (err) {
                    console.error(err)
                } else {
                    this.message    = '';
                    this.uploads    = []
                }
            })
        },

        /**
         * TITLE        : Initialization method
         * DESCRIPTION  : Initialize event audition
         *
         */
        initializeConnection() {
            socket.on('users:update', users => {
                this.users = [...users]
            })

            socket.on('message:new', message => {
                let inMessage       = message,
                    outMessages     = this.messages,
                    lastOutMessages = outMessages.length - 1;

                if(outMessages.length && outMessages[lastOutMessages].collection[outMessages[lastOutMessages].collection.length - 1].from_id === inMessage.collection[0].from_id &&
                    outMessages[outMessages.length - 1].collection[outMessages[outMessages.length - 1].collection.length - 1].stack_id !== inMessage.collection[0].stack_id) {

                    outMessages[outMessages.length - 1].collection.push(inMessage.collection[0]);
                    inMessage.collection.splice(0, 1)
                }

                if(outMessages.length && inMessage.collection.length && outMessages[outMessages.length - 1].collection[outMessages[outMessages.length - 1].collection.length - 1].stack_id === inMessage.collection[0].stack_id) {

                    if(inMessage.collection[0].upload.length) {
                        outMessages[outMessages.length - 1].collection[outMessages[outMessages.length - 1].collection.length - 1].upload.push(inMessage.collection[0].upload[0])
                    }

                    if(inMessage.collection[0].body) {
                        outMessages[outMessages.length - 1].collection[outMessages[outMessages.length - 1].collection.length - 1].body = inMessage.collection[0].body;
                    }
                }

                // Omit scroll to the last message
                this.scrollToBottom(this.$refs.messages)
            })

            // Omit scroll to the last message
            this.scrollToBottom(this.$refs.messages)
        },

        /**
         * TITLE        : Initialization socket
         * DESCRIPTION  : Initialize connections of the authorized user
         *
         */
        initializeSocket() {
            socket.emit('join', this.user, data => {
                if (typeof data === 'string') {
                    console.error(data)
                } else {

                    this.messages = [];
                    this.user.id  = data.userId;
                    let $this     = this;

                    axios.post('messages/all?transport=messages', {'room_id': this.user.room})
                         .then(function (response) {
                            if(response.status === 200) {
                                if(response.data.result.length) {
                                    response.data.result.forEach(function(element) {
                                        $this.messages.push(element);
                                    });

                                    // Omit scroll to the last message
                                    $this.scrollToBottom($this.$refs.messages)
                                }
                            } else {
                                console.log('ошибка')
                            }
                         })
                         .catch(error => {
                            console.error(error);
                         });

                    // Omit scroll to the last message
                    //this.scrollToBottom(this.$refs.messages)

                    this.initializeConnection();
                }
            })
        },

        /**
         * TITLE        : View method
         * DESCRIPTION  : Scroll down
         *
         */
        scrollToBottom(node) {
            setTimeout(() => {
                node.scrollTop = node.scrollHeight
            })
        }
    },

    /**
     * TITLE        : Vue method
     * DESCRIPTION  : Initialize the hook before instantiating the instance
     *
     */
    mounted() {
        axios.post('users/get', {}).then(response => {
            if(response.status === 200){
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

/**
 * TITLE        : Component registration
 * DESCRIPTION  : Registers a component in a vue instance
 *
 */
Vue.component('message-stack', {
    props: ['item', 'user', 'index'],
    template: `
    <div class="message" :class="{'owner': item.user.socket_id === user.id || item.user.roles === 'GUEST', 'error': item.success === false}">
        <div v-for="(value, key) in item.collection">
            <div class="message-content z-depth-1" v-if="value.upload.length">
                <div>{{value.body}}</div>
                <div v-for="(file, index) in value.upload">
                    <div v-if="file.type.match(/image*/)">
                        <img class="img" v-bind:src="'upload/'+user.room+'/'+file.name+'_196'+file.ext"></img>
                    </div>
                    <div v-else>
                        <div class="document">
                            <span>{{file.original_name}}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="message-content z-depth-1" v-else>
                {{item.user.name}}: {{value.body}}
            </div>
        </div>
    </div>
  `
})