'use strict';

/**
 * TITLE        : Socket.io method
 * DESCRIPTION  : Connect to sockets
 *
 */
const socket = io();

/**
 * TITLE        : Config method
 * DESCRIPTION  : Setting App
 *
 */
const settings = {
    notice: {
        error_upload:       'Во время загрузки файлов произошла ошибка...',
        error_task_create:  'Не удалось создать задачу...',
        error_select_type:  'Вы не указали тип задачи...',
        success_planner:    'Задача успешно создана'
    },
    color: {
        info:   '#7a7a7acc',
        danger: '#f44336',
        white:  '#FFFFFF'
    }
}

/**
 * TITLE        : New Vue
 * DESCRIPTION  : Create a new instance of Vue
 *
 */
let vue = new Vue({
    el: '#app',
    data: {
        config      : {
            message: {
                type: {
                    text: "text",
                    image: "image",
                    document: "document"
                },
                category: {
                    message: "message",
                    planner: "planner",
                    comment: "comment"
                }
            }
        },
        message     : '',
        search      : '',
        messages    : [],
        selected    : [],
        user        : {},
        users       : [],
        usersList   : [],
        uploads     : [],
        triggerUpload: false,
        previews    : [],
        profile     : {
            assistants  : [],
            user        : {},
            images      : {
                offset      : 0,
                loading     : 0,
                collection  : []
            },
            documents   : {
                offset      : 0,
                loading     : 0,
                collection  : []
            }
        },
        profileShow  : false,
        offsetMessage: 0,
        limitMessages: 30,
        loading      : {
            innerBox     : 0,
            startBox     : 0,
            messageBox   : 0
        },
        plannerMessages  : [],
        plannerInType    : [],
        plannerOneType   : '',
        plannerError     : false,
        newMessage       : []
    },
    methods: {
        /**
         * TITLE        : Message method
         * DESCRIPTION  : Method of sending messages
         *
         */
        sendMessage() {

            if(this.message.length === 0) {
                if(this.uploads.length === 0)
                    return;
            }

            const text = {
                text  : this.message,
                type  : this.config.message.type.text
            };

            if(this.message.length > 0) {
                this.uploads.push(text);
            }

            // Body message
            const message = {
                id          : this.user.id,
                category    : this.config.message.category.message,
                messages    : this.uploads,
                planner     : {}
            }

            // Sending a new message
            socket.emit('message:create', message, err => {
                if (err) {
                    console.error(err)
                } else {
                    this.message  = '';
                    this.uploads  = [];
                    this.previews = [];
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
                        if(this.usersList[j].attributes.online === true){
                           this.usersList[j].attributes.online = false;
                        } else {
                           this.usersList[j].attributes.online = true;
                        }
                    }
                }
            })

            // Listen to the event of receiving a list of online users
            socket.on('users:get', user => {
                for(let i = 0; i < user.length; i++){
                    let j = this.usersList.findIndex(u => u.id === user[i].id)
                    if(j !== undefined){
                        this.usersList[j].attributes.online = true;
                    }
                }
            })

            socket.on('message:new', message => {

                // Listen to the message receiving event
                let inMessage       = message,
                    this_clone      = this,
                    outMessages     = this_clone.messages,
                    lastOutMessages = outMessages.length - 1;

                if(message.user.roles === 'BOOKER') {

                   let assistant = this.profile.assistants.find(u => u.id === message.user.id);

                   if(!assistant) {
                       let newAssistant = {};
                       newAssistant.id             = message.user.id;
                       newAssistant.email          = message.user.email;
                       newAssistant.first_name     = message.user.first_name ;
                       newAssistant.last_name      = message.user.last_name;
                       newAssistant.roles          = message.user.roles;
                       newAssistant.display_name   = message.user.display_name;
                       newAssistant.short_name     = message.user.short_name;

                       this.profile.assistants.push(newAssistant);
                   }
                }

                if(outMessages.length && outMessages[lastOutMessages].collection[outMessages[lastOutMessages].collection.length - 1].from_id === inMessage.collection[0].from_id &&
                   outMessages[outMessages.length - 1].collection[outMessages[outMessages.length - 1].collection.length - 1].stack_id !== inMessage.collection[0].stack_id &&
                   outMessages[outMessages.length - 1].collection[outMessages[outMessages.length - 1].collection.length - 1].category === inMessage.collection[0].category) {

                    outMessages[outMessages.length - 1].collection.push(inMessage.collection[0]);
                }
                else if(outMessages.length && outMessages[outMessages.length - 1].collection[outMessages[outMessages.length - 1].collection.length - 1].stack_id === inMessage.collection[0].stack_id) {

                    if(inMessage.collection[0].upload.length) {
                        outMessages[outMessages.length - 1].collection[outMessages[outMessages.length - 1].collection.length - 1].upload.push(inMessage.collection[0].upload[0])
                    }

                    if(inMessage.collection[0].body) {
                        outMessages[outMessages.length - 1].collection[outMessages[outMessages.length - 1].collection.length - 1].body = inMessage.collection[0].body;
                    }
                }
                else {
                    outMessages.push(inMessage);
                }

                if (inMessage.user.id !== this.user.id) {
                    for (let i = 0; i < this.usersList.length; i++) {

                        if (this.usersList[i].id === inMessage.user.id && this.usersList[i].attributes.current) {
                            socket.emit('message:read', inMessage);

                        }
                    }
                }

                this.loading.messageBox = 1;
                this_clone.scrollToBottom(this.$refs.messages)
            })

            socket.on('hiddenMessage:new', message => {

                let this_clone = this;

                const closeMessage = function(id) {

                    setTimeout(function(){
                        for(let i = 0; i < this_clone.newMessage.length; i ++) {
                            if(this_clone.newMessage[i].id === id) {
                                this_clone.newMessage.splice(i, 1);
                            }
                        }
                    }, 5000)
                };

                this.usersList.forEach(function(elem) {
                    if (elem.id === message.user.id && !elem.attributes.current) {
                        elem.attributes.unread = elem.attributes.unread + 1;

                        this_clone.newMessage.push({
                            id:             message.collection[message.collection.length - 1].id,
                            display_name:   message.user.display_name,
                            short_name:     message.user.short_name,
                            body:           message.collection[message.collection.length - 1].body
                        });

                        closeMessage(message.collection[message.collection.length - 1].id);
                    }
                });
            });

            socket.on('message:read', message => {
                for (let i = this.messages.length - 1; i >= 0; i--) {
                    for (let j = 0; j < this.messages[i].collection.length; j++) {
                        if (!this.messages[i].collection[j].is_read && (this.messages[i].user.id === message.user.id)) {
                             this.messages[i].collection[j].is_read = 1;
                        }
                    }
                }
            });


            socket.on('message:read_all', user => {

                for (let i = this.messages.length - 1; i >= 0; i--) {
                    for (let j = this.messages[i].collection.length - 1; j >= 0; j--) {
                        if (!this.messages[i].collection[j].is_read && (this.messages[i].user.id !== user.id)) {
                             this.messages[i].collection[j].is_read = 1;
                        } else {
                            break;
                        }
                    }
                }
            });
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

        /**
         * TITLE        : View method
         * DESCRIPTION  : Scroll
         *
         */
        handleScroll(evt) {

            let scrollTop    = parseInt(evt.target.scrollTop),
                heightScroll = scrollTop + parseInt(window.getComputedStyle(evt.target, null).height) - 6,
                boxInner     = this.$refs.messages,
                heightPage   = boxInner.scrollHeight;


            if (heightPage - heightScroll > 30) {
                this.triggerScroll = true;
            }
            else {
                this.triggerScroll = false;
            }

            if(scrollTop < 200 && this.triggerLoad) {

                this.triggerLoad = false;
                this.heightBox   = heightPage;

                this.loadingMessage();
            }
        },

        loadingMessage() {

            let this_clone      = this;
            this.offsetMessage  = this.offsetMessage + this.limitMessages;

            axios.post('messages/all?transport=messages', {'room_id': this.user.room, 'offset': this.offsetMessage})
                 .then(function (response) {
                    if(response.status === 200) {

                        if(response.data.result.length === 0) {
                            console.log('Сообщений больше нет')
                            return;
                        }

                        let inMessage  = response.data.result,
                            outMessage = this_clone.messages;

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

                        this_clone.$nextTick(function () {

                            // entire view has been re-rendered
                            if(!this_clone.triggerLoad) {

                                let box         = this_clone.$refs.messages,
                                    boxHeight   = box.scrollHeight,
                                    scrollStart = box.scrollTop < 200
                                                ? (this_clone.heightBox + box.scrollTop)
                                                : (this_clone.heightBox - box.scrollTop);

                                box.scrollTop = boxHeight - scrollStart;

                                this_clone.triggerLoad = true;
                            }
                        })

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
         * DESCRIPTION  : Reset room setting`s
         *
         */
        resetRoom() {

            this.previews             = [];
            this.uploads              = [];
            this.offsetMessage        = 0;

            // Reset settings profile
            this.profile = {
                assistants  : [],
                user        : {},
                images      : {
                    offset      : 0,
                    step        : 20,
                    loading     : 0,
                    collection  : []
                },
                documents   : {
                    offset      : 0,
                    step        : 20,
                    loading     : 0,
                    collection  : []
                }
            };
            this.loading.messageBox = 0;
            this.clearSelected();
            $('.modal-window-xl').modal('hide');

        },

        /**
         * TITLE        : User`s method
         * DESCRIPTION  : Initialize a new dialogue with the client
         *
         */
        initializeRoom(data) {

            this.resetRoom();
            let this_clone  = this;
            this.user.room  = data.room;

            for (let i = 0; i < this.usersList.length; i++) {
                this.usersList[i].attributes.current = false;
                if(this.usersList[i].id === data.id) {

                    // Set current, if current user is selected
                    this.usersList[i].attributes.current = true;

                    // Reset unread, if current user is selected
                    this.usersList[i].attributes.unread = 0;
                }
            }

            socket.emit('message:update', {user: data, update_from: true});

            this.getProfileAssistant(data.room, data.id);

            socket.emit('join', this.user, data => {

                if (typeof data === 'string') {
                    console.error(data)
                }
                else {

                    this.messages         = [];
                    this.loading.innerBox = 1;

                    axios.post('messages/all?transport=messages', {'room_id': this.user.room, 'in_upload': true})
                         .then(function (response) {
                            if(response.status === 200) {
                                if(response.data.result.length) {

                                    response.data.result.forEach(function(element) {
                                        this_clone.messages.unshift(element)
                                    });


                                    if(response.data.attachments.length) {

                                        this_clone.uploads      = response.data.attachments;
                                        let objectPreview = {};

                                        for(let i = 0; i < response.data.attachments.length; i++) {
                                            objectPreview           = {};
                                            objectPreview.status    = 1;
                                            objectPreview.progress  = 100;
                                            objectPreview.id        = response.data.attachments[i].id;
                                            objectPreview.name      = response.data.attachments[i].original_name;
                                            objectPreview.size      = response.data.attachments[i].size;

                                            objectPreview.image     = response.data.attachments[i].thumb_xs
                                                                    ? response.data.attachments[i].thumb_xs
                                                                    :(response.data.attachments[i].thumb_sm
                                                                    ? response.data.attachments[i].thumb_sm
                                                                    : response.data.attachments[i].thumb);

                                            objectPreview.blob      = response.data.attachments[i].type.match(/image*/)
                                                                    ? objectPreview.image
                                                                    : null;

                                            this_clone.previews.push(objectPreview);

                                        }
                                    }

                                    // View box message
                                    this_clone.loading.messageBox = 1;

                                    // Omit scroll to the last message


                                    this_clone.triggerLoad = true;

                                    setTimeout(function() {
                                        this_clone.$refs.messages.addEventListener('scroll', this_clone.handleScroll);
                                        this_clone.scrollToBottom(this_clone.$refs.messages);
                                    })
                                }
                                else {

                                    // View empty box message
                                    this_clone.loading.messageBox = 2;
                                }
                            } else {
                                console.log('ошибка')
                            }
                         })
                         .catch(error => {
                            console.error(error);
                         });

                }
            })
        },

        /**
         * TITLE        : User`s method
         * DESCRIPTION  : Get list assistant for dialog
         *
         */
        getProfileAssistant(room_id, user_id) {
            axios.post('users/profile?transport=users', {id_user: user_id, id_room: room_id})
                .then(response => {
                    if(response.status === 200) {
                        if(response.data.status !== 0) {
                            this.profile.assistants  = response.data.assistants;
                            this.profile.user        = response.data.user;
                        }
                    }
                })
                .catch(error => {
                    console.log(error);
                });
        },

        /**
         * TITLE        : Upload method
         * DESCRIPTION  : Initialize file upload
         *
         */
        initializeUploadFile(event) {

            let i = 0;
            let this_clone  = this;
                this_clone.triggerUpload = true;

            const upload = function(i)  {

                let objectPreview               = {};
                let objectHeader                = {};
                let data                        = new FormData();
                let random                      = Math.random().toString(16).slice(2);

                objectHeader.onUploadProgress   = this_clone.uploadProgress(this_clone);
                objectHeader.headers            = {'Content-Type': 'multipart/form-data'};

                objectPreview.id                = 0;
                objectPreview.status            = 0;
                objectPreview.progress          = 0;
                objectPreview.name              = event.target.files[i].name;
                objectPreview.size              = filesize(event.target.files[i].size);
                objectPreview.blob              = event.target.files[i].type.match(/image*/)
                                                ? URL.createObjectURL(event.target.files[i])
                                                : null;

                this_clone.previews.push(objectPreview);

                data.append('file', event.target.files[i]);
                data.append('room', this_clone.user.room);

                axios.post('upload/loading?transport=uploads&sid='+random+'', data, objectHeader)
                     .then(function (response) {
                        if(response.status === 200){

                            this_clone.previews[this_clone.previews.length - 1].status = 1;
                            this_clone.previews[this_clone.previews.length - 1].id     = response.data.attachment.id;

                            this_clone.uploads.push(response.data.attachment);

                            i++;

                            if (i < event.target.files.length) {
                                upload(i);
                            }else {
                                this_clone.triggerUpload = false;
                            }
                        }
                     })
                    .catch(error => {
                        this_clone.previews.splice(this_clone.previews[this_clone.previews.length - 1], 1);
                        alert(settings.notice.error_upload);
                    })
            };

            upload(i);
        },

        /**
         * TITLE        : View method
         * DESCRIPTION  : Render status progress for file
         *
         */
        uploadProgress(this_clone) {
            return function (progress) {

                let percentage = Math.floor((progress.loaded * 100)/progress.total);
                this_clone.previews[this_clone.previews.length - 1].progress = percentage;
                if(this_clone.bar) {
                    this_clone.bar.set(percentage);
                }

            }
        },

        previewRemove(id) {

            // Get information attachment
            let object = this.uploads.find(u => u.id === id);

            // Clear information from array
            this.previews = this.previews.filter(u => u.id !== id);
            this.uploads  = this.uploads.filter(u => u.id !== id);

            // Delete attachments from date base
            axios.post('uploads/delete?transport=uploads', {'id': id, 'room': this.user.room, 'name': object.name, 'ext': object.ext})
                 .then(response => {
                    if(response.status === 200) {

                    }
                 })
                 .catch(error => {
                    console.log(error);
                 })
        },

        /**
         * TITLE        : View method
         * DESCRIPTION  : Upload images for profile
         *
         */
        loadingPhoto(trigger) {

            if(this.profile.images.collection.length && !trigger) {
                return;
            }

            this.profile.images.offset = trigger ? this.profile.images.offset + 10 : 0;

            // Load photos for profile
            axios.post('uploads/get?transport=uploads&type=image', {'room': this.user.room, offset: this.profile.images.offset})
                .then(response => {
                    if(response.status === 200) {
                        if(response.data.attachments.length){
                            this.profile.images.collection = response.data.attachments;

                            // Success load
                            this.profile.images.loading = 1;
                        }
                        else {

                            // Un success load (empty result)
                            this.profile.images.loading = 2;
                        }
                    }
                    else {

                        // Error result
                        this.profile.images.loading = 3;
                    }
                })
                .catch(error => {
                    console.log(error);
                })
        },

        /**
         * TITLE        : View method
         * DESCRIPTION  : Upload images for profile
         *
         */
        loadingFiles(trigger) {

            if(this.profile.documents.collection.length && !trigger) {
                return;
            }

            this.profile.documents.offset = trigger ? this.profile.documents.offset + 10 : 0;

            // Load photos for profile
            axios.post('uploads/get?transport=uploads&type=document', {'room': this.user.room, offset: this.profile.documents.offset})
                .then(response => {
                    if(response.status === 200) {
                        if(response.data.attachments.length){
                            this.profile.documents.collection = response.data.attachments;

                            // Success load
                            this.profile.documents.loading = 1;
                        }
                        else {

                            // Un success load (empty result)
                            this.profile.documents.loading = 2;
                        }
                    }
                    else {

                        // Error result
                        this.profile.documents.loading = 3;
                    }
                })
                .catch(error => {
                    console.log(error);
                })
        },

        openPlanner() {

            this.plannerMessages = [];

            for(let i = 0; i < this.messages.length; i++) {

                for(let j = 0; j < this.messages[i].collection.length; j++) {

                    if(!this.selected.find(e => e.id === this.messages[i].collection[j].stack_id))
                        continue;

                    if(this.plannerMessages.length) {
                        if(this.plannerMessages[this.plannerMessages.length - 1].user.id === this.messages[i].user.id) {
                            if(this.plannerMessages[this.plannerMessages.length - 1].collection[this.plannerMessages[this.plannerMessages.length - 1].collection.length - 1].from_id === this.messages[i].collection[j].from_id) {
                                this.plannerMessages[this.plannerMessages.length - 1].collection.push(this.messages[i].collection[j])
                                continue;
                            }
                        }
                    }

                    this.plannerMessages.push({});
                    this.plannerMessages[this.plannerMessages.length - 1].user       = this.messages[i].user;
                    this.plannerMessages[this.plannerMessages.length - 1].collection = [];
                    this.plannerMessages[this.plannerMessages.length - 1].collection.push(this.messages[i].collection[j]);
                }
            }

            this.plannerInType = [];

            this.plannerInType.push({id: 1, type: 'Клиентский запрос'});
            this.plannerInType.push({id: 2, type: 'Клиентский запрос 2'});
            this.plannerInType.push({id: 3, type: 'Клиентский запрос 3'});
        },

        createPlanner() {

            let formData    = new FormData(),
                this_clone  = this,
                form        = $("#form-planner"),
                header      = form.find('[name="header"]').val(),
                data        = form.serializeArray();

            // Reset error message
            this.plannerError = false;

            // Check the field
            for(let i = 0; i < data.length; i++) {
                if(!data[i].value || data[i].value.length < 3) {
                    this.plannerError = true;
                } else
                    formData.append(data[i].name, data[i].value);

            }

            // Check the type
            if(!this.plannerOneType)
                this.plannerError = true;

            // Refund if the error
            if(this.plannerError === true)
                return;

            // Sort the selected messages
            for(let i = 0, m = []; i < this.selected.length; i ++) {
                m[i] = this.selected[i].id;

                if(i === this.selected.length - 1) {
                    formData.append('selected', JSON.stringify(m));
                }
            }

            // Add data to send
            formData.append('type', this.plannerOneType);
            formData.append('user', this.profile.user.id);

            // Send to server
            axios.post('task/create?transport=task', formData)
                 .then(function (response) {
                    if(response.status === 200){
                        if(response.data.status) {
                            this_clone.newPlanner(response.data.result);
                            this_clone.clearSelected();
                        }
                    }
                 })
                 .catch(error => {
                     console.log(error)
                 })
        },

        newPlanner(data) {

            // Body message
            const message = {
                id          : 1,
                category    : this.config.message.category.planner,
                messages    : [{
                    text: data.header,
                    type: this.config.message.type.text
                }],
                planner     : {
                    id: data.id
                }
            };

            // Sending a new message
            socket.emit('message:create', message, err => {
                if (err) {
                    console.error(err)
                }
            })

            data.room = this.user.room;

            // Sending a new notice
            socket.emit('planner:new', data, err => {
                if (err) {
                    console.error(err)
                }
            })

        },

        closeNotify(id) {
            for(let i = 0; i < this.newMessage.length; i++) {
                if(this.newMessage[i].id === id) {
                    this.newMessage.splice(i, 1)
                }
            }
        },

        clearSelected() {
            this.plannerMessages = [];
            this.selected = [];
            this.plannerError = false;
            this.plannerOneType = '';
            $('.in-message').removeClass('in-message_selected');
            $('#form-planner').find("input[type=text], textarea").val('');
            $('#form-planner').find("button").removeClass('selected');
            $('#send-taskmanager').modal('hide');
        },

        createDatePicker() {
            $('[name="datetime"]').datetimepicker({
                locale: 'ru',
                format: 'YYYY-MM-DD HH:mm:ss'
            });
        },

        /**
         * TITLE        : View method
         * DESCRIPTION  : declension
         *
         */
        declOfNum(number) {
            let titles = ['сообщение', 'сообщения', 'сообщений'];
            let cases = [2, 0, 1, 1, 1, 2];
            return titles[ (number%100>4 && number%100<20)? 2 : cases[(number%10<5)?number%10:5] ];
        },

        /**
         * TITLE        : View method
         * DESCRIPTION  : Scroll down
         *
         */
        scrollToBottom(node) {
            if(!node) return;
            setTimeout(() => {
                node.scrollTop = node.scrollHeight;
                $(node).parent().scrollTop(node.scrollHeight)
            })
        },
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
        let this_clone = this;
        setTimeout(function() {
            this_clone.loading.startBox = 1;
            document.getElementsByClassName('app-body-inner')[0].classList.remove("hide");
        }, 1000);

        // Get list users
        axios.post('users/list?transport=users')
             .then(response => {
                if(response.status === 200) {
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
 *
 */
Vue.component('message-stack', {
    props: ['item', 'user', 'index', 'config'],
    inheritAttrs: false,
    methods: {
        selectedMessage(id) {
            if(vue.selected.find(e => e.id === id)) {
                $(event.target).closest('.in-message').removeClass('in-message_selected');
                vue.selected = vue.selected.filter(e => e.id !== id);
            } else {
                $(event.target).closest('.in-message').addClass('in-message_selected');
                vue.selected.push({id: id});
            }
        }
    },
    template:
        `<div class="message-stack"
            :class="{'mess-in'  : item.user.roles === 'GUEST', 
                     'mess-out' : item.user.roles === 'BOOKER' || item.user.roles === 'SYSTEM',
                     'error'    : item.success    === false
                    }"
     >
        <div class="message-stack-photo" v-if="item.user.roles === 'GUEST'">
            <span class="w-40 avatar img-circle">{{item.user.short_name}}</span>
        </div>
        <div class="message-stack-content">
            <div class="in-message" v-for="(value, key) in item.collection" v-bind:data-msgid="value.stack_id" v-if="value.category === config.message.category.message">
                <div class="select-message" @click="selectedMessage(value.stack_id)">
                    <span><i class="ion-checkmark-circled"></i></span>
                </div>
                <div class="text-message in-message_media" v-if="value.upload.length">
                    <div class="body-message">
                        <span v-if="value.body">{{value.body}}</span>
                        <div v-for="(file, index) in value.upload" v-if="file.type.match(/image*/)">
                            <img class="img" v-if="file.thumb_xs" v-bind:src="file.thumb_xs"></img>
                            <img class="img" v-else-if="file.thumb_sm" v-bind:src="file.thumb_sm"></img>
                            <img class="img" v-else v-bind:src="file.thumb"></img>
                        </div>
                        <div v-for="(file, index) in value.upload" v-if="!file.type.match(/image*/)">
                            <a v-bind:href="file.name" class="item-attachment">
                                <span class="label-icon"><i class="ion-android-document"></i></span>
                                <span class="label-text">
                                    <span>{{file.original_name}}</span>
                                    <small class="text-muted">{{file.size}}</small>
                                </span>  
                            </a>
                        </div>       
                    </div>
                    <span class="info-message">
                        <span>{{value.datetime}}</span>
                        <span class="info-done-message" v-if="item.user.id === value.from_id">
                            <i class="ion-android-done-all" v-if="value.is_read"></i>
                            <i class="ion-android-done" v-else></i>
                        </span>
                    </span>
                </div>
                <div class="text-message" v-else>
                    <span class="body-message">{{value.body}}</span>
                    <div class="info-message">
                        <span>{{value.datetime}}</span>
                        <span class="info-done-message" v-if="item.user.roles === 'BOOKER'">
                            <i class="ion-android-done-all" v-if="value.is_read"></i>
                            <i class="ion-android-done" v-else></i>
                        </span>
                    </div>
                </div>
            </div>
            <div class="in-message in-message_notify" v-for="(value, key) in item.collection" v-bind:data-msgid="value.stack_id" v-if="value.category === config.message.category.planner">
                <div class="text-message">
                    <div class="header-message">У бухгалтера новая задача</div>
                    <span class="body-message">{{value.body}}</span>
                    <div class="info-message">
                        <span>{{value.datetime}}</span>
                    </div>
                </div>
            </div> 
            <div class="in-message in-message_comment" v-for="(value, key) in item.collection" v-bind:data-msgid="value.stack_id" v-if="value.category === config.message.category.comment">
                <div class="text-message">
                    <div class="header-message">
                        <div class="header-icon">
                            <img src="img/ic-quote_arrow.svg">
                        </div>
                        <div class="header-body">
                            <span>По задаче</span>
                            <span>{{value.planner.header}}</span>
                        </div>
                    </div>
                    <div class="body-message" v-if="value.upload.length">
                        <span v-if="value.body">{{value.body}}</span>
                        <div class="message-media" v-for="(file, index) in value.upload">
                            <a v-bind:href="file.name" class="item-attachment">
                                <span class="label-icon" v-if="file.type.match(/image*/)">
                                    <img class="img" v-if="file.thumb_xs" v-bind:src="file.thumb_xs"></img>
                                    <img class="img" v-else-if="file.thumb_sm" v-bind:src="file.thumb_sm"></img>
                                    <img class="img" v-else v-bind:src="file.thumb"></img>
                                </span>
                                <span class="label-icon" v-else>
                                    <i class="ion-android-document"></i>
                                </span>
                                <span class="label-text">
                                    <span>{{file.original_name}}</span>
                                    <small>{{file.size}}</small>
                                </span>  
                            </a>
                        </div>   
                    </div>
                    <div class="body-message" v-else>
                        <span>{{value.body}}</span>
                    </div>
                    <div class="info-message">
                        <span>{{value.datetime}}</span>
                    </div>
                </div>
                <div class="row-status" v-if="user.id === value.from_id">
                    <span class="status-text" v-if="value.is_read" v-bind:data-msgid="value.is_read">
                        <span>Прочитано</span><img src="img/accepted_ok.svg">
                    </span>
                    <span class="status-text" v-else>
                        <span>Отправлено</span><img src="img/ic-accepted.svg">
                    </span>
                </div>
            </div>
        </div>    
        <div class="message-stack-photo" v-if="item.user.roles === 'BOOKER'">
            <span class="w-40 avatar img-circle">{{item.user.short_name}}</span>
        </div>    
        <div class="message-stack-photo" v-if="item.user.roles === 'SYSTEM'">
            <span class="w-40 avatar img-circle"><img src="img/shape.svg"></span>
        </div>   
    </div>`
})

Vue.component('planner-message', {
    props: ['item', 'user'],
    mounted() {
        if(this.$options.propsData.item.collection.length <= 1) {
            if(!this.$options.propsData.item.collection[0].body) {
                this.$el.remove()
            }
        }
    },
    template:
        `<div class="message-stack" 
              :class="{'mess-in'  : item.user.roles === 'GUEST', 
                       'mess-out' : item.user.roles === 'BOOKER'}"
         >
            <div class="message-stack-photo" v-if="item.user.roles === 'GUEST'">
                <span class="w-40 avatar img-circle">{{item.user.short_name}}</span>
            </div>
            <div class="message-stack-content">
                <div class="in-message" v-for="(value, key) in item.collection">
                    <div class="text-message">
                        <span class="body-message">{{value.body}}</span>
                        <div class="info-message">
                            <span>{{value.datetime}}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="message-stack-photo" v-if="item.user.roles === 'BOOKER'">
                <span class="w-40 avatar img-circle">{{item.user.short_name}}</span>
            </div> 
        </div>`
})

Vue.component('planner-attachment', {
    props: ['item', 'user'],
    template:
        `<div>
            <div class="box-item" v-for="(value, key) in item.collection" v-if="value.upload.length">
                <a class="item-attachment" v-for="(file, index) in value.upload" v-bind:href="file.thumb">
                    <span class="label-icon" v-bind:data-msgid="file.name">
                        <i class="ion-image" v-if="file.type.match(/image*/)"></i>
                        <i class="ion-android-document" v-else></i>
                    </span> 
                    <span class="label-text">
                        <span>{{file.original_name}}</span> 
                        <small class="text-muted">{{file.size}}</small>
                    </span>
                </a>
            </div>   
        </div>`
})

Vue.component('attachment-view', {
    props: ['item'],
    inheritAttrs: false,
    methods: {
        previewRemove(id) {
            vue.previewRemove(id);
        }
    },
    template:
        `<div class="in-preview-upload">
            <div class="in-preview-item">
                <div class="in-preview-src" v-if="item.blob">
                    <img v-bind:src="item.blob"> 
                </div>
                <div class="in-preview-file" v-else>
                       <span class="label-icon"><i class="ion-android-document"></i></span>
                       <span class="label-name">{{item.name}}</span>
                       <span class="label-size">{{item.size}}</span>
                </div>
                <div class="in-preview-close" v-if="item.status === 1" @click="previewRemove(item.id)">
                    <i class="ion-close"></i>
                </div>
                <div class="in-preview-preloader" v-else>
                    <span><i class="fa fa-circle-o-notch fa-spin fa-fw"></i></span>
                </div>
            </div>
        </div>`
});

Vue.component('assistant-dialog', {
    props: ['item'],
    inheritAttrs: false,
    template:
        `<div class="list-item ">
            <div class="list-left">
                <span class="w-40 avatar w-orange img-circle">{{item.short_name}}</span>
            </div>
            <div class="list-body">
                <div class="item-title">
                    <span class="_500">{{item.display_name}}</span>
                </div>
                <small class="block text-muted text-ellipsis">
                    {{item.email}}
                </small>
            </div>
        </div>`
})

Vue.component('profile-image', {
    props: ['item'],
    inheritAttrs: false,
    template:
        `<div>
            <div class="p-x m-t p-v-xs _600">{{item.datetime}}</div>
            <div class="item">
                <div class="row no-gutter">
                    <div class="col-xs-4" v-for="(image, index) in item.uploads">
                        <a v-bind:href="image.thumb_xs ? image.thumb_xs : image.thumb_sm ? image.thumb_sm : image.thumb" data-toggle="lightbox" data-gallery="example-gallery" class="col-sm-4 w-full">
                            <img v-bind:src="image.thumb_xs ? image.thumb_xs : image.thumb_sm ? image.thumb_sm : image.thumb" class="w-full img-fluid">
                        </a>
                    </div>
                </div>
            </div>
        </div>`
})

Vue.component('profile-file', {
    props: ['item'],
    inheritAttrs: false,
    template:
        `<div>
            <div class="p-x m-t p-v-xs _600">{{item.datetime}}</div>    
            <div class="list-item" v-for="(file, index) in item.uploads">
                <div class="list-left">
                    <span class="w-56 avatar">
                        <img alt="." src="img/ic_document.png">
                    </span>
                </div>
                <div class="list-body">
                    <a href="#" class="text-ellipsis _500">{{file.original_name}}</a>
                    <span class="clear text-muted text-ellipsis text-xs">{{file.size}}</span>
                    <span class="clear text-muted text-ellipsis text-xs p-t-xs">{{file.fulltime}}</span>
                </div>
            </div>
        </div>`
})

Vue.component('planner-type', {
    props: ['item'],
    methods: {
        click(evt) {

            let button    = $(evt.target).closest('button'),
                attribute = button.data('type');

            $('.btn-type-task').removeClass('selected');

            vue.plannerOneType = attribute;
            button.addClass('selected');
        }
    },
    template:
        `<button type="button" class="btn btn-type-task m-b-sm" v-bind:data-type="item.id" @click="click($event)">
            <i class="fa fa-plus pull-left"></i>
            {{item.type}}
        </button>`
})








