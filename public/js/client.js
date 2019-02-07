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

            this.attachments.push(text);

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
                if(this.messages.length && this.messages[this.messages.length - 1].message.stack === message.message.stack) {
                    let objectNew = {
                        message : this.messages[this.messages.length - 1].message,
                        success : this.messages[this.messages.length - 1].success,
                        user    : this.messages[this.messages.length - 1].user
                    };
                    this.messages.splice(this.messages.length - 1, 1);
                    if(message.message.upload.length) {
                        objectNew.message.upload.push(message.message.upload[0]);
                    }
                    if(message.message.body) {
                        objectNew.message.body = message.message.body;
                    }
                    this.messages.push(objectNew);
                } else {
                    this.messages.push(message);
                }

                if (message.user.id != this.user.id) {
                    socket.emit('message:user_read', message, data => {
                        axios.post('messages/update_read',message)
                            .then(response => {
                                if(response.status == 200) {
                                    console.log('Обновление прочитанных сообщений')
                                }
                                message.message.is_read = 1;
                            })
                            .catch(error => {
                                console.log(error);
                            })
                    });
                }

                // Omit scroll to the last message
                this.scrollToBottom(this.$refs.messages)
            })

            socket.on('message:operator_read', user => {
                for (let i=this.messages.length - 1; i >= 0; i--) {
                    if (!this.messages[i].message.is_read && (this.messages[i].user.id != user.id)) {
                        this.messages[i].message.is_read = 1;
                    } else {
                        break;
                    }
                }
            })

            socket.on('message:user_read_all', user => {
                for (let i=this.messages.length - 1; i >= 0; i--) {
                    if (!this.messages[i].message.is_read && (this.messages[i].user.id != user.id)) {
                        this.messages[i].message.is_read = 1;
                    } else {
                        break;
                    }
                }
            })

            socket.on('message:operator_read_all', user => {
                for (let i=this.messages.length - 1; i >= 0; i--) {
                    if (!this.messages[i].message.is_read) {
                        this.messages[i].message.is_read = 1;
                    } else {
                        break;
                    }
                }
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

                    let $this     = this;

                    axios.post('messages/all?transport=messages', {'room_id': this.user.room})
                         .then(function (response) {
                            if(response.status === 200) {
                                console.log(response.data);
                                if(response.data.messages.length) {
                                    response.data.messages.forEach(function(element) {
                                        $this.messages.push(element);
                                    });

                                    // Omit scroll to the last message
                                    $this.scrollToBottom($this.$refs.messages)
                                }
                            } else {
                                console.log('ошибка')
                            }
                             axios.post('users/update?transport=users',{id_room: $this.user.room, update_from_client: true})
                                 .then(response => {
                                     if(response.status == 200) {
                                         console.log('Обновление прочитанных сообщений')
                                     }
                                     socket.emit('message:user_read_all', $this.user, data => {
                                         for (let i=$this.messages.length - 1; i>=0; i--) {
                                             if (!$this.messages[i].message.is_read && ($this.messages[i].user.id != $this.user.id)) {
                                                 $this.messages[i].message.is_read = 1
                                             } else {
                                                 break;
                                             }
                                         }
                                     });

                                 })
                                 .catch(error => {
                                     console.log(error);
                                 })
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
Vue.component('chat-message', {
    props: ['item', 'user'],
    template: `
    <div class="message" :class="{'owner': item.user.socket_id === user.id || item.user.roles === 'GUEST', 'error': item.success === false}">
        <div class="message-content z-depth-1" v-if="item.message.upload.length">
            <div>{{item.message.body}}</div>
            <div v-for="(value, key) in item.message.upload">
                <div v-if="value.type.match(/image*/)">
                    <img class="img" v-if="value.resize" v-bind:src="'upload/'+user.room+'/'+value.name+'_196'+value.ext"></img>
                    <img class="img" v-else v-bind:src="'upload/'+user.room+'/'+value.name+value.ext"></img>
                </div>
                <div v-else>
                    <div class="document">
                        <span>{{value.original_name}}</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="message-content z-depth-1" v-else>
            {{item.user.name}}: {{item.message.body}}
        </div>
        <div v-if="item.message.is_read" class="lala">
             <span>Прочитано</span>
         </div>
         <div v-else class="lala">
             <span>Доставлено</span>
         </div>
    </div>
  `
})