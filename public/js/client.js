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
const vue = new Vue({
    el: '#app',
    data: {
        message     : '',
        messages    : [],
        user        : {},
        users       : [],
        usersOnline : [],
        previews    : [],
        uploads     : [],
        offsetMessage : 0,
        triggerUpload : false,
        triggerScroll : false,
        triggerLoad   : true,
        heightBox     : 0
    },
    methods: {

        /**
         * TITLE        : Message method
         * DESCRIPTION  : Method of sending messages
         *
         */
        sendMessage() {

            if(this.message.length === 0) {
                if(this.uploads.length === 0 || this.triggerUpload)
                    return;
            }

            const text = {
                text  : this.message,
                type  : 'text'
            };

            if(this.message.length > 0) {
                this.uploads.push(text);
            }

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
                    this.uploads    = [];
                    this.previews   = [];
                    this.resizeHeight();
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
                    socket.emit('message:read', inMessage);
                }

                // Omit scroll to the last message
                this.scrollToBottom(this.$refs.messages)
            })

            socket.on('message:read', user => {
                for (let i = this.messages.length - 1; i >= 0; i--) {
                    for (let j = this.messages[i].collection.length - 1; j>= 0; j--) {
                        if (!this.messages[i].collection[j].is_read && (this.messages[i].user.id !== user.id)) {
                             this.messages[i].collection[j].is_read = 1;
                        } else {
                            break;
                        }
                    }
                }
            })

            socket.on('message:read_all', info => {
                for (let i = this.messages.length - 1; i >= 0; i--) {
                    for (let j = this.messages[i].collection.length - 1; j >= 0; j--) {

                        if (!this.messages[i].collection[j].is_read && (this.messages[i].user.id === info.user.id)) {

                            this.messages[i].collection[j].is_read = 1;
                        } else {
                            break;
                        }
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

                    this.messages  = [];

                    let this_clone = this;

                    axios.post('messages/all?transport=messages', {'room_id': this.user.room, 'in_upload': true})
                         .then(function (response) {
                            if(response.status === 200) {

                                if(response.data.result.length) {
                                    response.data.result.forEach(function(element) {
                                        this_clone.messages.unshift(element);
                                    });

                                    if(response.data.attachments.length) {

                                        this_clone.uploads      = response.data.attachments;
                                        let objectPreview  = {};

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

                                    // Omit scroll to the last message
                                    this_clone.scrollToBottom(this_clone.$refs.messages);

                                    this_clone.resizeHeight();
                                }
                            } else {
                                console.log('ошибка')
                            }


                            socket.emit('message:update', {user: this_clone.user, update_from: false});

                         })
                         .catch(error => {
                            console.error(error);
                         });

                    // Omit scroll to the last message
                    this.scrollToBottom(this.$refs.messages)

                    this.initializeConnection();
                }
            })
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

                this_clone.resizeHeight();

                axios.post('upload/loading?transport=uploads&sid='+random+'', data, objectHeader)
                    .then(function (response) {
                        if(response.status === 200){

                            this_clone.previews[this_clone.previews.length - 1].status = 1;
                            this_clone.previews[this_clone.previews.length - 1].id     = response.data.attachment.id;

                            this_clone.uploads.push(response.data.attachment);

                            i++;

                            if (i < event.target.files.length) {
                                upload(i);
                            } else {
                                this_clone.triggerUpload = false;
                            }
                        }
                    })
                    .catch(error => {
                        this_clone.previews.splice(this_clone.previews[this_clone.previews.length - 1], 1);
                        /*alert(settings.notice.error_upload);*/
                    })
            };

            upload(i);
        },

        /**
         * TITLE        : Upload method
         * DESCRIPTION  : Delete review file
         *
         */
        previewRemove(id) {

            // Get information attachment
            let object      = this.uploads.find(u => u.id === id);
            let this_clone  = this;

            // Clear information from array
            this.previews = this.previews.filter(u => u.id !== id);
            this.uploads  = this.uploads.filter(u => u.id !== id);

            // Delete attachments from date base
            axios.post('uploads/delete?transport=uploads', {'id': id, 'room': this.user.room, 'name': object.name, 'ext': object.ext})
                .then(response => {
                    this_clone.resizeHeight()
                })
                .catch(error => {
                    console.log(error);
                })
        },

        /**
         * TITLE        : View method
         * DESCRIPTION  : Resize width + height footer box
         *
         */
        resizeHeight() {

            let scrollEnd       = this.triggerScroll,
                boxFooter       = this.$refs.footer,
                boxTextArea     = this.$refs.textarea,
                boxInner        = this.$refs.messages,
                boxAttachment   = this.$refs.attachments;

            setTimeout(() => {
                boxTextArea.style.bottom = window.getComputedStyle(boxFooter, null).height;
                window.autosize.update(document.querySelectorAll('textarea'))

                if(!scrollEnd) {
                    //boxInner.scrollTop =  boxInner.scrollHeight;
                }

                boxAttachment.scrollLeft = boxAttachment.scrollHeight;
            })
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

            if(scrollTop <= 0 && this.triggerLoad) {

                this.triggerLoad = false;
                this.heightBox   = heightPage;

                this.loadingMessage();
            }
        },

        loadingMessage() {

            let this_clone      = this;
            this.offsetMessage  = this.offsetMessage + 10;

            axios.post('messages/all?transport=messages', {'room_id': this.user.room, 'offset': this.offsetMessage})
                .then(function (response) {
                    if(response.status === 200) {

                        if(response.data.result.length === 0) {
                            console.log('Сообщений больше нет');
                            this_clone.triggerLoad = false;
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
                                let box         = document.querySelectorAll('.row-inner')[0],
                                    boxHeight   = box.scrollHeight,
                                    scrollStart = box.scrollTop <= 0
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
        window.autosize(this.$refs.textarea);
        this.$refs.messages.addEventListener('scroll', this.handleScroll);
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
<div class="message-stack"
            :class="{'mess-in'  : item.user.roles === 'GUEST', 
                     'mess-out' : item.user.roles === 'BOOKER',
                     'error'    : item.success    === false
                    }"
    >
    <div class="message-stack-photo">AK</div>
    <div class="message-stack-content">
        <div class="in-message" v-for="(value, key) in item.collection" v-bind:data-msgid="value.stack_id">
            <div class="text-message in-message_media" v-if="value.upload.length">
                <div class="body-message">
                    <span v-if="value.body">{{value.body}}</span>
                    <div class="message-media" v-for="(file, index) in value.upload" v-if="file.type.match(/image*/)">
                        <img class="img" v-if="file.thumb_xs" v-bind:src="file.thumb_xs"></img>
                        <img class="img" v-else-if="file.thumb_sm" v-bind:src="file.thumb_sm"></img>
                        <img class="img" v-else v-bind:src="file.thumb"></img>
                    </div>
                    <div class="message-file" v-for="(file, index) in value.upload" v-if="!file.type.match(/image*/)">
                        <a v-bind:href="file.name" class="item-attachment">
                            <span class="label-icon"><i class="fa fa-file"></i></span>
                            <span class="label-text">
                                <span>{{file.original_name}}</span>
                                <small>34kb</small>
                            </span>  
                        </a>
                    </div>   
                </div>
                <span class="info-message">
                    <span>{{value.datetime}}</span>
                </span>
            </div>
            <div class="text-message" v-else>
                <span class="body-message">{{value.body}}</span>
                <div class="info-message">
                    <span>{{value.datetime}}</span>
                </div>
            </div>
            <div class="row-status" v-if="user.id === value.from_id">
                <span class="status-text" v-if="value.is_read">
                    <span>Прочитано</span><img src="img/accepted_ok.svg">
                </span>
                <span class="status-text" v-else>
                    <span>Отправлено</span><img src="img/ic-accepted.svg">
                </span>
            </div>
        </div>  
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
        `<div class="in-preview-item">
            <div class="in-item">
                <div class="in-preview-src" v-if="item.blob">
                    <img v-bind:src="item.blob"> 
                </div>
                <div class="in-preview-file" v-else>
                       <span class="label-icon"><i class="fa fa-file"></i></span>
                       <span class="label-name">{{item.name}}</span>
                       <span class="label-size">{{item.size}}</span>
                </div>
                <div class="in-preview-close" v-if="item.status === 1" @click="previewRemove(item.id)">
                    <img src="img/ic-close.svg"/>
                </div>
                <div class="in-preview-preloader" v-else>
                    <span><i class="fa fa-circle-o-notch fa-spin fa-fw"></i></span>
                </div>
            </div>
        </div>`
});
