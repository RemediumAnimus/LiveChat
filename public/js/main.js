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
        usersList   : [],
        uploads     : [],
        offset      : 0
    },
    methods: {

        /**
         * TITLE        : Message method
         * DESCRIPTION  : Method of sending messages
         *
         */
        sendMessage() {

            const text = {
                text  : this.message,
                type  : 'text'
            };

            this.uploads.push(text);

            // Body message
            const message = {
                id          : this.user.id,
                text        : this.message,
                messages    : this.uploads,
            }

            // Sending a new message
            socket.emit('message:create', message, err => {
                if (err) {
                    console.error(err)
                } else {
                    this.message = '';
                    this.uploads = []
                }
            })
        },

        /**
         * TITLE        : Socket.io method
         * DESCRIPTION  : Initialize event audition
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
                for(let i = 0; i < user.length; i++){
                    let j = this.usersList.findIndex(u => u.id === user[i].id)
                    if(j != undefined){
                        this.usersList[j].online = true;
                    }
                }
            })

            // Listen to the message receiving event
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
                console.log(this.usersList);
                if (message.user.id != this.user.id) {
                    for (let i=0; i<this.usersList.length; i++) {
                        if (this.usersList[i].id == message.user.id && this.usersList[i].current) {
                            socket.emit('message:operator_read', message, data => {
                                axios.post('messages/update_read', message)
                                    .then(response => {
                                        if (response.status == 200) {
                                            console.log('Обновление прочитанных сообщений')
                                        }
                                        message.message.is_read = 1;
                                    })
                                    .catch(error => {
                                        console.log(error);
                                    })
                            });
                        }
                    }
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

            socket.on('message:user_read', message => {
                for (let i=this.messages.length - 1; i >= 0; i--) {
                    if (!this.messages[i].message.is_read && (this.messages[i].user.id == message.user.id)) {
                        this.messages[i].message.is_read = 1;
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

            // Omit scroll to the last message
            this.scrollToBottom(this.$refs.messages)
        },

        /**
         * TITLE        : Socket.io method
         * DESCRIPTION  : Initialize connections of the authorized user
         *
         */
        initializeSocket() {

            // Get the list online
            socket.emit('users:get');

            // Initialize Socket Taps
            this.initializeConnection();
        },

        loadingMessage() {

            let $this = this;
            this.offset = this.offset + 10;

            axios.post('messages/all?transport=messages', {'room_id': this.user.room, 'offset': this.offset})
                .then(function (response) {
                    if(response.status === 200) {

                        if(response.data.result.length === 0) {
                            console.log('Сообщений больше нет')
                            return;
                        }

                        let inMessage  = response.data.result,
                            outMessage = $this.messages;

                        if(inMessage[0].collection[inMessage[0].collection.length - 1].from_id  === outMessage[0].collection[0].from_id &&
                           inMessage[0].collection[inMessage[0].collection.length - 1].stack_id !== outMessage[0].collection[0].stack_id){

                            for(let i = inMessage[0].collection.length - 1; i >= 0; i--){
                                outMessage[0].collection.unshift(inMessage[0].collection[i])
                            }

                            inMessage.splice(inMessage[inMessage.length - 1], 1);
                        }

                        if(inMessage.length && inMessage[0].collection[inMessage[0].collection.length - 1].stack_id === outMessage[0].collection[0].stack_id) {

                            if(inMessage[0].collection[inMessage[0].collection.length - 1].upload.length) {

                                inMessage[0].collection[inMessage[0].collection.length - 1].upload.forEach(function (file) {
                                    outMessage[0].collection[0].upload.unshift(file);
                                });

                                if(!outMessage[0].collection[0].body) {
                                    outMessage[0].collection[0].body = inMessage[0].collection[inMessage[0].collection.length - 1].body;
                                    outMessage[0].collection[0].type = inMessage[0].collection[inMessage[0].collection.length - 1].type;
                                }

                                inMessage[0].collection.splice(0, 1);
                            }

                            inMessage[0].collection.forEach(function(element) {
                                outMessage[outMessage.length - 1].collection.unshift(element)
                            });

                            inMessage.splice(0, 1);
                        }

                        inMessage.forEach(function(item) {
                            outMessage.unshift(item)
                        });

                    } else {
                        console.log('Error getting message list...')
                    }
                })
                .catch(error => {
                    console.error(error);
                })
        },

        /**
         * TITLE        : User`s method
         * DESCRIPTION  : Initialize a new dialogue with the client
         *
         */
        initializeRoom(data, event) {

            for (let i = 0; i < this.usersList.length; i++) {
                this.usersList[i].current = false;
                if (this.usersList[i].id == data.id) {

                    // Set current, if current user is selected
                    this.usersList[i].current = true;
                }
            }
            axios.post('users/update?transport=users',{id_user: data.id, update_from_operator: true})
                 .then(response => {
                    if(response.status == 200) {
                        console.log('Обновление прочитанных сообщений')
                    }
                 })
                 .catch(error => {
                    console.log(error);
                 })

            data.notify     = false;
            this.user.room  = data.room;

            socket.emit('join', this.user, data => {
                if (typeof data === 'string') {
                    console.error(data)
                }
                else {

                    this.messages = [];
                    let $this     = this;

                    axios.post('messages/all?transport=messages', {'room_id': this.user.room})
                         .then(function (response) {
                            if(response.status === 200) {
                                if(response.data.result.length) {
                                    response.data.result.forEach(function(element) {
                                        $this.messages.unshift(element)
                                    });

                                    socket.emit('message:operator_read_all', $this.user, data => {
                                        for (let i=$this.messages.length - 1; i>=0; i--) {
                                            if (!$this.messages[i].message.is_read && ($this.messages[i].user.id != $this.user.id)) {
                                                $this.messages[i].message.is_read = 1
                                            } else {
                                                break;
                                            }
                                        }
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
                            if(response.status === 200) {
                                if(response.data.attachments.length) {
                                    console.log('Есть неотправленные вложения')
                                    this.uploads = response.data.attachments;
                                    this.reloadPreview(response.data.attachments);
                                }
                            }
                         })
                         .catch(error => {
                            console.log(error);
                         })

                }
            })
        },

        /**
         * TITLE        : Upload method
         * DESCRIPTION  : Initialize file upload
         *
         */
        initializeUploadFile(event) {

            for (let i = 0; i < event.target.files.length; i++) {
                let data        = new FormData();
                let this_clone  = this;
                let random      = Math.random().toString(16).slice(2);
                let uploads     = this.uploads;
                let reader      = new FileReader();
                let settings    = {
                    headers: {'Content-Type': 'multipart/form-data'}/*,
                    onUploadProgress: this.uploadProgress(random)*/
                };

                //this.renderPreview(event.target.files[i], random, reader);
                data.append('file', event.target.files[i]);
                data.append('room', this.user.room);

                axios.post('upload/loading?transport=uploads&sid='+random+'', data, settings)
                     .then(function (response) {
                        if(response.status === 200){
                            //this_clone.statusProgress(random, true);
                            uploads.push(response.data.attachment);
                        } else {
                            //this_clone.statusProgress(random, false);
                        }
                     })
                     .catch(error => {
                         //this_clone.statusProgress(random, true);
                     })
            }
        },

        /**
         * TITLE        : View method
         * DESCRIPTION  : Render preview for upload
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
         * TITLE        : View method
         * DESCRIPTION  : Render preview for upload after reload window
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
         * TITLE        : View method
         * DESCRIPTION  : Render status progress for file
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
         * TITLE        : View method
         * DESCRIPTION  : Upload status progress for file
         *
         */
        statusProgress(identity, status) {
            let preview = document.getElementById('preview');
            let item = preview.querySelectorAll('[data-id="'+identity+'"]');

            if(status === true) {
                item[0].getElementsByClassName('item-preload')[0].innerHTML = 'Загружено';
            } else {
                item[0].getElementsByClassName('item-preload')[0].innerHTML = 'Ошибка';
            }

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
     * DESCRIPTION  : Initialize the hook after creating the instance
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
     * TITLE        : Vue method
     * DESCRIPTION  : Initialize the hook before instantiating the instance
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
 * TITLE        : Component registration
 * DESCRIPTION  : Registers a component in a vue instance
 * 'hide'     : item.collection.length === 1 && index === length - 1 && item.collection[item.collection.length - 1].upload.length > 1
 */
Vue.component('message-stack', {
    props: ['item', 'user', 'index', 'length'],
    inheritAttrs: false,
    template:
     `<div class="message-stack m-b"
            :class="{'mess-in'  : item.user.roles === 'GUEST', 
                     'mess-out' : item.user.roles === 'BOOKER',
                     'error'    : item.success    === false
                    }"
     >
     
        <div class="message-stack-photo" v-if="item.user.roles === 'GUEST'">
            <span class="w-40 avatar img-circle">АК</span>
        </div>
        <div class="message-stack-content">
            <div class="in-message" v-for="(value, key) in item.collection" data-msgid="">
                <div class="select-message">
                    <span><i class="ion-checkmark-circled"></i></span>
                </div>
                <div class="text-message in-message_media" v-if="value.upload.length">
                    <div class="body-message">
                        <span>{{value.body}}</span>
                        <a href="#" v-for="(file, index) in value.upload">
                            <img class="img" v-if="file.type.match(/image*/)" v-bind:src="'upload/'+user.room+'/'+file.name+'_196'+file.ext"></img>
                            <span v-else>{{file.original_name}}</span>
                        </a>     
                    </div>
                    <span class="info-message">{{value.datetime}}</span>
                </div>
                <div class="text-message" v-else>
                    <span class="body-message">{{value.body}}</span>
                    <span class="info-message">{{value.datetime}}</span>
                </div>
            </div>

        </div>    
        <div class="message-stack-photo" v-if="item.user.roles === 'BOOKER'">
            <span class="w-40 avatar img-circle">АК</span>
        </div>
        <!--<div v-if="item.message.is_read" class="lala">
             <span>Прочитано</span>
         </div>
         <div v-else class="lala">
             <span>Доставлено</span>
         </div>-->
    </div>`
})

