'use strict';

/**
 * Connect to sockets
 *
 */
const socket = io();

/**
 * Create a new instance of Vue
 *
 */
new Vue({
    el: '#app',
    data: {
        message     : '',
        messages    : [],
        users       : [],
        usersList   : [],
        attachments : [],
        user        : {
                        name    : '',
                        room    : '',
                        roles   : ''
                    }
    },
    methods: {
        /**
         * Method of sending messages
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
                messages    : this.attachments,
            }

            // Sending a new message
            socket.emit('message:create', message, err => {
                if (err) {
                    console.error(err)
                } else {
                    this.message = '';
                    this.attachments = []
                }
            })
        },
        /**
         * Initialize event audition
         *
         */
        initializeConnection() {

            // Listen to the update event of users in the room
            socket.on('users:update', users => {
                this.users = [...users]
            })

            // Listen to the user status update event.
            socket.on('users:status', user => {
                for(let j = 0; j < this.usersList.length; j++) {
                    if(this.usersList[j].id === user.id) {
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
                console.log('Получаем список онлайн пользователей')
                for(let i = 0; i < user.length; i++){
                    let j = this.usersList.findIndex(u => u.id === user[i].id)
                    if(j != undefined){
                        this.usersList[j].online = true;
                    }
                }
            })

            // Listen to the message receiving event
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
                this.scrollToBottom(this.$refs.messages)
            })

            socket.on('hiddenMessage:new', message => {
                this.usersList.forEach(function(elem) {
                    if (elem.id == message.user.id && !elem.current) {
                        elem.notify = true;
                    }
                })
            })

            // Omit scroll to the last message
            this.scrollToBottom(this.$refs.messages)
        },

        /**
         * Initialize connections of the authorized user
         *
         */
        initializeSocket() {

            // Get the list online
            socket.emit('users:get');

            // Initialize Socket Taps
            this.initializeConnection();
        },

        /**
         * Initialize a new dialogue with the client
         *
         */
        initializeRoom(data) {

            for (let i=0; i<this.usersList.length; i++) {
                this.usersList[i].current = false;
                if (this.usersList[i].id == data.id) {

                    // Set current, if current user is selected
                    this.usersList[i].current = true;
                }
            }

            axios.post('users/update?transport=users',{id_user: data.id})
                 .then(response => {
                    if(response.status == 200) {
                        console.log('Обновление прочитанных сообщений')
                    }
                 })
                 .catch(error => {
                    console.log(error);
                 })

            data.notify = false;
            this.user.room = data.room;

            socket.emit('join', this.user, data => {
                if (typeof data === 'string') {
                    console.error(data)
                }
                else {

                    //this.user.id = data.userId;
                    this.messages = [];
                    let messages = this.messages;
                    let $this    = this;

                    axios.post('messages/all?transport=messages', {'room_id': this.user.room})
                         .then(function (response) {
                             console.log(response);
                            if(response.status === 200) {
                                if(response.data.messages.length) {
                                    response.data.messages.forEach(function(element) {
                                        messages.push(element)
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
                         })

                    // Get attachments information
                    axios.post('uploads/attachments?transport=uploads', {'room_id': this.user.room})
                        .then(response => {
                            if(response.status === 200){
                                console.log('Есть неотправленные вложения')
                                this.attachments = response.data.attachments;
                                this.reloadPreview(response.data.attachments);
                            }
                        })
                        .catch(error => {
                            console.log(error);
                        })

                }
            })
        },

        /**
         * Initialize file upload
         *
         */
        initializeUploadFile(event) {

            for (let i = 0; i < event.target.files.length; i++) {
                let data        = new FormData();
                let this_clone  = this;
                let random      = Math.random().toString(16).slice(2);
                let attachments = this.attachments;
                let reader      = new FileReader();
                let settings    = {
                    headers: {'Content-Type': 'multipart/form-data'},
                    onUploadProgress: this.uploadProgress(random)
                };

                this.renderPreview(event.target.files[i], random, reader);
                data.append('file', event.target.files[i]);
                data.append('room', this.user.room);

                axios.post('upload/loading?transport=uploads&sid='+random+'', data, settings)
                     .then(function (response) {
                        if(response.status === 200){
                            this_clone.statusProgress(random);
                            attachments.push(response.data.attachment);
                        } else {
                            console.log('ошибка')
                        }
                     })
                     .catch(error => {
                        console.log(error);
                     })
            }
        },

        /**
         * Render preview for upload
         *
         */
        renderPreview(file, random, reader, item, img, preload) {
            reader.addEventListener("load", function(event) {
                item = document.createElement("li");
                item.className = "item";
                item.setAttribute("data-id", random);

                img = document.createElement("img");
                img.className = "img-absolute";

                img.src = file.type.match(/image.*/)
                    ? event.target.result
                    : event.target.result;

                preload = document.createElement("span");
                preload.className = "item-preload";

                item.appendChild(img);
                item.appendChild(preload);

                document.getElementById('preview').appendChild(item);
            });
            reader.readAsDataURL(file);
        },

        /**
         * Render preview for upload after reload window
         *
         */
        reloadPreview(file, item, img, preload) {
            for(let i = 0; i < file.length; i++) {
                item = document.createElement("li");
                item.className = "item";
                item.setAttribute("data-id", file[i].id);

                img = document.createElement("img");
                img.className = "img-absolute";
                img.src = file[i].type.match(/image.*/)
                    ? 'upload/'+file[i].name+file[i].ext
                    : event.target.result;

                preload = document.createElement("span");
                preload.className = "item-preload";

                item.appendChild(img);
                item.appendChild(preload);

                document.getElementById('preview').appendChild(item);
            }
        },

        /**
         * Render status progress for file
         *
         */
        uploadProgress(identity) {
            return function (progress) {
                let preview = document.getElementById('preview');
                let item = preview.querySelectorAll('[data-id="'+identity+'"]');
                let percentage = Math.floor((progress.loaded * 100)/progress.total);

                item[0].getElementsByClassName('item-preload')[0].innerHTML = percentage;
            }
        },

        /**
         * Upload status progress for file
         *
         */
        statusProgress(identity) {
            let preview = document.getElementById('preview');
            let item = preview.querySelectorAll('[data-id="'+identity+'"]');

            item[0].getElementsByClassName('item-preload')[0].innerHTML = 'Загружено';
        },

        /**
         * Scroll down
         *
         */
        scrollToBottom(node) {
            setTimeout(() => {
                node.scrollTop = node.scrollHeight
            })
        }
    },

    /**
     * Initialize the hook after creating the instance
     *
     */
    created() {

        // Get user information
        axios.post('users/get?transport=users')
             .then(response => {
                if(response.status === 200){
                    console.log('Пользовательские даные получены')
                    this.user = response.data;
                    this.initializeSocket();
                } else {
                    window.location = "/"
                }
             })
             .catch(error => {
                console.error(error);
             })
    },

    /**
     * Initialize the hook before instantiating the instance
     *
     */
    mounted() {

        // Get list users
        axios.post('users/list?transport=users')
             .then(response => {
                if(response.status == 200) {
                    console.log('Получен список пользователей')
                    this.usersList = response.data;
                }
             })
             .catch(error => {
                console.log(error);
             })
    }
})

/**
 * Define a new component
 *
 */
Vue.component('chat-message', {
    props: ['item', 'user'],
    inheritAttrs: false,
    template: `
    <div class="message" 
        :class="{'owner': item.user.roles === 'BOOKER', 'error': item.success === false}"
    >
        <div class="message-content z-depth-1" v-if="item.message.upload.length">
            <div>{{item.message.body}}</div>
            <div v-for="(value, key) in item.message.upload">
                <img class="img" v-bind:src="'upload/'+value.name+'_196'+value.ext"></img>
            </div>
        </div>
        <div class="message-content z-depth-1" v-else>
            {{item.user.name}}: {{item.message.body}}
        </div>
    </div>
  `
})
