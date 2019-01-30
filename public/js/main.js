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

            // Body message
            const message = {
                id          : this.user.id,
                text        : this.message,
                attachments : this.attachments
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
                this.messages.push(message);
                console.log(this.messages)
                this.scrollToBottom(this.$refs.messages)
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
            this.user.room = data.room;
            socket.emit('join', this.user, data => {
                if (typeof data === 'string') {
                    console.error(data)
                } else {
                    this.user.id = data.userId;

                    axios.post('messages/all?transport=messages&uid='+data.userId+'', {'room_id': this.user.room})
                        .then(function (response) {
                            if(response.status === 200){
                                console.log(response)
                            } else {
                                console.log('ошибка')
                            }
                        })
                        .catch(error => {
                            console.error(error);
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

        // Get attachments information
        axios.post('uploads/attachments?transport=uploads')
             .then(response => {
                if(response.status === 200){
                    console.log('Есть неотправленные вложения')
                    this.attachments = response.data.attachments;
                }
             })
             .catch(error => {
                console.log(error);
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
    props: ['message', 'user'],
    template: `
    <div class="message" 
        :class="{'owner': message.user.roles === 'BOOKER', 'error': message.success === false}"
    >
        <div class="message-content z-depth-1">
            {{message.user.name}}: {{message.message.body}}
        </div>
    </div>
  `
})
