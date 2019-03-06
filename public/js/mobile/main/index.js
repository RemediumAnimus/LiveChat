'use strict';

/**
 * TITLE        : Socket.io method
 * DESCRIPTION  : Connect to sockets
 *
 */
const socket = io();

/**
 * TITLE        : Component registration
 * DESCRIPTION  : Registers a component in a vue instance
 *
 */
Vue.component('message-welcome', {
    props: ['user'],
    template:
        `<div class="message-stack mess-out">
            <div class="message-stack-photo" style="display: block"><img src="img/ic-welcome.png"></div>
            <div class="message-stack-content">
                <div class="in-message">
                    <div class="text-message">
                        <span class="body-message">
                            Здравствуйте, {{user.first_name}}. 
                            Благодарим за Ваш выбор и оказанное нам доверие!
                            Вы являетесь Клиентом сервиса бухгалтерского аутсорсинга Главбух Ассистент.        
                            Меня зовут Екатерина, я Ваш личный менеджер.               
                            Чтобы поставить задачу мне, бухгалтеру или юристу, просто опишите ее в данном чате или приложите фото документов.                   
                            Список всех Задач можно будет увидеть, если нажать на иконку в правом верхнем углу.                   
                            В Меню настроек находится раздел Файлы, где Вы найдете все ранее переданные в приложении документы.                  
                            С уважением к Вам и Вашему бизнесу!
                        </span>
                    </div>
                </div>  
            </div>
        </div>`
})


/**
 * TITLE        : New Vue
 * DESCRIPTION  : Create a new instance of Vue
 *
 */
const vue = new Vue({
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
        message       : '',
        commentMessage: '',
        messages      : [],
        user          : {},
        users         : [],
        usersOnline   : [],
        previews      : [],
        uploads       : [],
        commentUploads: [],
        offsetMessage : 0,
        triggerDev    : true,
        triggerUpload : false,
        triggerScroll : false,
        triggerLoad   : true,
        heightBox     : 0,
        startLoader   : false,
        offsetPlanner : {
            client: 0,
            booker: 0
        },
        plannerList   : {
            client: {
                complete  : [],
                incomplete: []
            },
            booker: {
                complete  : [],
                incomplete: []
            }
        },
        triggerPlanner: {
            client: false,
            booker: false
        },
        openPlanner: {},
        replyMessage: {},
        detailLoad  : true,
        detailOffset: 0,
        detailLimit : 5,
        detailScroll: true,
        detailTrigger: true,
        commentPreviews: []
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

            if(Object.keys(this.replyMessage).length !== 0) {
                message.planner  = this.replyMessage.planner;
                message.category = this.config.message.category.comment;
            }

            socket.emit('message:create', message, err => {
                if (err) {
                    console.error(err)
                } else {
                    this.message    = '';
                    this.uploads    = [];
                    this.previews   = [];
                    this.replyMessage = {},
                    this.resizeHeight();
                }
            })
        },

        /**
         * TITLE        : Comment method
         * DESCRIPTION  : Method of sending messages with comment window
         *
         */
        sendComment() {

            if(this.commentMessage.length === 0) {
                if(this.commentUploads.length === 0 || this.triggerUpload)
                    return;
            }

            const text = {
                text  : this.commentMessage,
                type  : this.config.message.type.text
            };

            if(this.commentMessage.length > 0) {
                this.commentUploads.push(text);
            }

            // Body message
            const message = {
                id          : this.user.id,
                category    : this.config.message.category.message,
                messages    : this.commentUploads,
                planner     : {}
            }

            message.planner  = this.openPlanner;
            message.category = this.config.message.category.comment;

            socket.emit('message:create', message, err => {
                if (err) {
                    console.error(err)
                } else {
                    this.commentMessage   = '';
                    this.commentUploads   = [];
                    this.commentPreviews  = [];
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
                    lastOutMessages = outMessages.length - 1,
                    plannerMessages = this.openPlanner.comment;

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
                    socket.emit('message:read', inMessage);
                }

                if(inMessage.collection[0].category === this.config.message.category.comment) {
                    if(inMessage.collection[0].planner.id === this.openPlanner.id) {
                        if(plannerMessages.length && plannerMessages[0].collection[0].stack_id !== inMessage.collection[0].stack_id) {
                            plannerMessages.unshift(inMessage);
                        }
                        if(!plannerMessages.length) {
                            plannerMessages.unshift(inMessage);
                        }
                    }
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

            socket.on('planner:new', info => {
                delete(info.room);
                switch(info.whose) {
                    case 0:
                        this.plannerList.client.incomplete.unshift(info);
                        break;
                    case 1:
                        this.plannerList.booker.incomplete.unshift(info);
                        break;
                }
            })
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

                    socket.emit('message:update', {user: this.user, update_from: false});

                    let this_clone = this;

                    axios.post('messages/all?transport=messages', {'room_id': this.user.room, 'in_upload': true})
                         .then(function (response) {
                            if(response.status === 200) {

                                if(response.data.result.length) {
                                    response.data.result.forEach(function(element) {
                                        this_clone.messages.unshift(element);
                                    });

                                    // Omit scroll to the last message
                                    this_clone.scrollToBottom(this_clone.$refs.messages);
                                }

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

                                    this_clone.resizeHeight();
                                }

                            } else {
                                console.log('ошибка')
                            }

                         })
                         .catch(error => {
                            console.error(error);
                         });

                    this.initializeConnection();

                    // Get list planner
                    this.initializePlanner();

                    setTimeout(function() {
                        this_clone.startLoader = true;
                    }, 1000)
                }
            })
        },

        /**
         * TITLE        : Planner method
         * DESCRIPTION  : Initialize list task
         *
         */
        initializePlanner() {
            let this_clone = this;

            axios.post('task/list?transport=planner&type=all')
                 .then(function (response) {
                    if(response.status === 200){
                        if(response.data.status) {

                            this_clone.plannerList.client.complete   = response.data.result[0].complete.length
                                                                     ? response.data.result[0].complete
                                                                     : [];

                            this_clone.plannerList.client.incomplete = response.data.result[0].incomplete.length
                                                                     ? response.data.result[0].incomplete
                                                                     : [];

                            this_clone.plannerList.booker.complete   = response.data.result[1].complete.length
                                                                     ? response.data.result[1].complete
                                                                     : [];

                            this_clone.plannerList.booker.incomplete = response.data.result[1].incomplete.length
                                                                     ? response.data.result[1].incomplete
                                                                     : [];
                        }
                    }
                 })
                 .catch(error => {
                    console.log(error)
                 })
        },

        /**
         * TITLE        : Planner method
         * DESCRIPTION  : Get planner list
         *
         */
        getListPlanner(type, offset) {

            let this_clone = this;

            axios.post('task/download?transport=planner&type='+type+'', {offset: offset})
                 .then(function (response) {
                    if(response.status === 200){
                        if(response.data.result) {
                            switch(type) {
                                case 0:
                                    if(response.data.result.complete.length) {
                                        for(let i = 0; i < response.data.result.complete.length; i++) {
                                            this_clone.plannerList.client.complete.push(response.data.result.complete[i]);
                                        }
                                    }
                                    if(response.data.result.incomplete.length) {
                                        for(let i = 0; i < response.data.result.incomplete.length; i++) {
                                            this_clone.plannerList.client.incomplete.push(response.data.result.incomplete[i]);
                                        }
                                    }
                                    this_clone.triggerPlanner.client = true;
                                    break;
                                case 1:
                                    if(response.data.result.complete.length) {
                                        for(let i = 0; i < response.data.result.complete.length; i++) {
                                            this_clone.plannerList.booker.complete.push(response.data.result.complete[i]);
                                        }
                                    }
                                    if(response.data.result.incomplete.length) {
                                        for(let i = 0; i < response.data.result.incomplete.length; i++) {
                                            this_clone.plannerList.booker.incomplete.push(response.data.result.incomplete[i]);
                                        }
                                    }
                                    this_clone.triggerPlanner.booker = true;
                                    break;
                            }
                        }
                        else {
                            switch(type) {
                                case 0:
                                    this_clone.triggerPlanner.client = true;
                                    break;
                                case 1:
                                    this_clone.triggerPlanner.booker = true;
                                    break;
                            }
                        }
                    }
                 })
                 .catch(error => {
                    console.log(error)
                 })
        },

        /**
         * TITLE        : Upload method
         * DESCRIPTION  : Initialize file upload
         *
         */
        initializeUploadFile(event, tmp, arr, trigger) {

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

                tmp.push(objectPreview);

                data.append('file', event.target.files[i]);
                data.append('room', this_clone.user.room);

                if(trigger) {
                    data.append('planner', this_clone.openPlanner.id);
                }

                this_clone.resizeHeight();

                axios.post('upload/loading?transport=uploads&sid='+random+'', data, objectHeader)
                    .then(function (response) {
                        if(response.status === 200){

                            tmp[tmp.length - 1].status = 1;
                            tmp[tmp.length - 1].id     = response.data.attachment.id;
                            arr.push(response.data.attachment);

                            i++;

                            if (i < event.target.files.length) {
                                upload(i);
                            } else {
                                this_clone.triggerUpload = false;
                            }
                        }
                    })
                    .catch(error => {
                        tmp.splice(tmp[tmp.length - 1], 1);
                    })
            };

            upload(i);
        },

        /**
         * TITLE        : Upload method
         * DESCRIPTION  : Delete review file
         *
         */
        previewRemove(id, tmp, arr) {

            // Get information attachment
            let object      = arr.find(u => u.id === id);
            let this_clone  = this;

            // Clear information from array
            for (let i = 0; i < tmp.length; i++) {
                if(tmp[i].id === id) {
                    tmp.splice(i, 1)
                }
            }

            for (let i = 0; i < arr.length; i++) {
                if(arr[i].id === id) {
                    arr.splice(i, 1)
                }
            }

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
                boxAttachment   = this.$refs.attachments,
                boxAttachmentCm = this.$refs.attachmentsComment;

            setTimeout(() => {
                boxTextArea.style.bottom = window.getComputedStyle(boxFooter, null).height;
                window.autosize.update(document.querySelectorAll('.send-message'))

                if(!scrollEnd) {
                    boxInner.scrollTop =  boxInner.scrollHeight;
                }

                boxAttachment.scrollLeft   = boxAttachment.scrollWidth;
                boxAttachmentCm.scrollLeft = boxAttachmentCm.scrollWidth;
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

            if(scrollTop < 200 && this.triggerLoad) {

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
                                    scrollStart = box.scrollTop < 200
                                                ? (this_clone.heightBox + box.scrollTop)
                                                : (this_clone.heightBox - box.scrollTop);

                                box.scrollTop = boxHeight - scrollStart;

                                //this_clone.triggerLoad = true;
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

        openNewTab(event, opening_page, current_page, action_page) {

            let this_clone    = this;
                opening_page  = opening_page ? opening_page : $(event.target).closest('.icon-link').attr('data-page');
                current_page  = current_page ? current_page : $(event.target).closest('.row-main').attr('id');
                action_page   = action_page ? action_page : $(event.target).closest('.icon-link').attr('data-action');

            if(action_page === "open") {
                $('#'+opening_page).find('.row-header').find('.row-icon span').attr('data-page', current_page);
            }

            if($('#'+opening_page).hasClass('hidden')) {
                $('#'+current_page).removeClass('visible');
            } else {
                $('#'+current_page).addClass('hidden');
            }

            $('#'+opening_page).addClass('visible').removeClass('hidden');

            $('#'+current_page).on("webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend", function() {
                this_clone.removeAnimate(current_page)
            });

            $('#'+opening_page).unbind("webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend");
        },

        removeAnimate(page) {
            $('#'+page).removeClass('visible');
        },

        changeTab(event) {
            let tap = $(event.target).closest('.row-tap'),
                tab = tap.data('tab');

            tap.closest('.row-tab').find('.row-tap').removeClass('active');
            tap.addClass('active');

            tap.closest('.row-main').find('.row-tab').removeClass('visible');
            $('#'+tab).addClass('visible');
        },

        replyClose() {
          this.replyMessage = {};
          this.resizeHeight();
        },

        openTabPlanner(type, complete, item, evt, opening_page, current_page, action_page) {

            if(this.openPlanner.id === item.id) {
                return this.openNewTab(evt, opening_page, current_page, action_page);
            }

            this.openPlanner     = {
                id              : item.id,
                data_create     : item.data_create,
                data_end        : item.data_end,
                description     : item.description,
                header          : item.header,
                status          : item.status,
                whose           : item.whose,
                comment         : []
            };

            this.detailOffset    = 0;
            this.detailLoad      = true;
            this.commentUploads  = [];
            this.commentPreviews = [];

            this.loadComment(item.id, this.detailOffset);
            this.loadAttachments(item.id);
            this.openNewTab(evt, opening_page, current_page, action_page);
        },

        loadComment(id, offset) {

            axios.post('task/comment?transport=planner', {id: id, offset: offset})
                 .then(function (response) {
                     if (response.status === 200) {
                         if (response.data.status) {

                             let inMessage  = response.data.result,
                                 outMessage = vue.openPlanner.comment;

                             if(vue.openPlanner.comment.length) {

                                 if(inMessage.length && inMessage[0].collection[0].stack_id === outMessage[outMessage.length - 1].collection[outMessage[outMessage.length - 1].collection.length - 1].stack_id) {

                                     if(inMessage[0].collection[0].upload.length) {

                                         inMessage[0].collection[0].upload.forEach(function (file) {
                                             outMessage[outMessage.length - 1].collection[outMessage[outMessage.length - 1].collection.length - 1].upload.push(file);
                                         });

                                         if(!outMessage[0].collection[0].body) {
                                             outMessage[outMessage.length - 1].collection[outMessage[outMessage.length - 1].collection.length - 1].body = inMessage[0].collection[0].body;
                                             outMessage[outMessage.length - 1].collection[outMessage[outMessage.length - 1].collection.length - 1].type = inMessage[0].collection[0].type;
                                         }

                                         inMessage[0].collection.splice(0, 1);
                                         inMessage[0].collection.splice(0, 1);
                                     }

                                     inMessage[0].collection.forEach(function(element) {
                                         outMessage[outMessage.length - 1].collection.push(element)
                                     });

                                     inMessage.splice(0, 1);
                                 }
                             }

                             inMessage.forEach(function(item) {
                                 outMessage.push(item)
                             });

                             setTimeout(function() {
                                 vue.detailTrigger = true;
                                 vue.$refs.commentList.addEventListener('scroll', vue.scrollComment);
                             })
                         }
                         else {
                             vue.detailTrigger = false;
                         }
                         vue.detailLoad = false;
                     }
                     else {
                         vue.detailLoad = false;
                     }
                 }).catch(error => {
                    console.log(error);
                 })
        },

        /**
         * TITLE        : Comment method
         * DESCRIPTION  : get attachments no uploading
         *
         */
        loadAttachments(id) {

            axios.post('task/attachments?transport=comment', {'room': this.user.room, 'id': id})
                .then(function (response) {
                    if(response.status === 200) {

                        if(response.data.attachments.length) {

                            vue.commentUploads = response.data.attachments;
                            let objectPreview         = {};

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

                                vue.commentPreviews.push(objectPreview);
                            }
                        }

                    } else {
                        console.log('ошибка')
                    }

                })
                .catch(error => {
                    console.error(error);
                });
        },

        /**
         * TITLE        : View method
         * DESCRIPTION  : Scroll
         *
         */
        scrollComment(evt) {

            let scrollTop    = parseInt(evt.target.scrollTop),
                heightScroll = scrollTop + parseInt(window.getComputedStyle(evt.target, null).height),
                boxInner     = this.$refs.commentList,
                heightPage   = boxInner.scrollHeight;

            if (heightPage - heightScroll < 200) {
                this.detailScroll = true;
            }
            else {
                this.detailScroll = false;
            }

            if(this.detailScroll && this.detailTrigger) {

                this.detailTrigger = false;
                this.detailOffset  = this.detailOffset + this.detailLimit;
                this.loadComment(this.openPlanner.id, this.detailOffset);
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
     * DESCRIPTION  : Initialize the hook before instantiating the instance
     *
     */
    mounted() {
        let this_clone = this;
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
        window.autosize(this.$refs.textareaComment);
    }
})

/**
 * TITLE        : Component registration
 * DESCRIPTION  : Registers a component in a vue instance
 *
 */
Vue.component('message-stack', {
    props: ['item', 'user', 'index', 'config'],
    methods: {
        replyMessage(id) {
            for (let i = vue.messages.length - 1; i >= 0; i--) {
                for (let j = vue.messages[i].collection.length - 1; j >= 0; j--) {
                    if(vue.messages[i].collection[j].id === id) {
                        vue.replyMessage = vue.messages[i].collection[j];
                        vue.resizeHeight();
                    }
                }
            }
        },
        open(item) {

            let objectType      = !item.planner.whose
                                ? 'client'
                                : 'booker',
                objectSuccess   = item.planner.status === 3
                                ? 'complete'
                                : 'incomplete',
                opening_page    = 'detail',
                current_page    = 'chat',
                action_page     = 'open';

            vue.openTabPlanner(objectType, objectSuccess, item.planner, null, opening_page, current_page, action_page);
        }
    },
    template: `
<div class="message-stack"
            :class="{'mess-in'  : item.user.roles === 'GUEST', 
                     'mess-out' : item.user.roles === 'BOOKER' || item.user.roles === 'SYSTEM',
                     'error'    : item.success    === false
                    }"
    >
    <div class="message-stack-photo">AK</div>
    <div class="message-stack-content">
        <div class="in-message" v-for="(value, key) in item.collection" v-bind:data-msgid="value.stack_id" v-if="value.category === config.message.category.message">
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
                            <span class="label-icon" v-if="item.user.roles === 'GUEST'"><img src="img/ic-file_mobile_white.svg"/></span>
                            <span class="label-icon" v-else><img src="img/ic-file_mobile.svg"/></span>
                            <span class="label-text">
                                <span>{{file.original_name}}</span>
                                <small>{{file.size}}</small>
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
                <span class="status-text" v-if="value.is_read" v-bind:data-msgid="value.is_read">
                    <span>Прочитано</span><img src="img/accepted_ok.svg">
                </span>
                <span class="status-text" v-else>
                    <span>Отправлено</span><img src="img/ic-accepted.svg">
                </span>
            </div>
        </div>
        <div class="in-message in-message_notice" v-for="(value, key) in item.collection" v-bind:data-msgid="value.stack_id" v-if="value.category === config.message.category.planner">
            <div class="text-message" @click="open(value)">
                <div class="header-message">У бухгалтера новая задача</div>
                <span class="body-message">{{value.body}}</span>
                <div class="info-message">
                    <span>{{value.datetime}}</span>
                </div>
            </div>
            <div class="reply-message" @click="replyMessage(value.id)">
                <img src="img/ic-reply.svg"/>
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
                                <img class="img img-border" v-if="file.thumb_xs" v-bind:src="file.thumb_xs"></img>
                                <img class="img img-border" v-else-if="file.thumb_sm" v-bind:src="file.thumb_sm"></img>
                                <img class="img img-border" v-else v-bind:src="file.thumb"></img>
                            </span>
                            <span class="label-icon" v-else>
                                <img class="img" src="img/ic-file_mobile_white.svg" v-if="item.user.roles === 'GUEST'"></img>
                                <img class="img" src="img/ic-file_mobile.svg" v-else></img>
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
</div>`
})

Vue.component('incomplete-task', {
    props: ['item'],
    methods: {
        open(evt, item) {
            let objectType    = $(evt.target).closest('.row-tab').attr('id'),
                objectSuccess = $(evt.target).closest('.row-list').data('type'),
                opening_page    = null,
                current_page    = null,
                action_page     = 'open';

            vue.openTabPlanner(objectType, objectSuccess, item, evt, opening_page, current_page, action_page);
        }
    },
    template:
        `<div class="row-item icon-link" data-page="detail" v-on:click="open($event, item)">
            <div class="row-pic">
                <img src="img/ic-my_task.svg" v-if="!item.whose">
                <img src="img/ic-booker_task.svg" v-else="item.whose">
            </div>
            <div class="row-body">
                <div class="row-header">
                    <span>{{item.header}}</span>
                </div>
                <div class="row-text">
                    <span>{{item.data_create}}</span>
                </div>
            </div>
        </div>`
});
Vue.component('complete-task', {
    props: ['item'],
    template:
        `<div class="row-item">
            <div class="row-pic">
                <img src="img/ic-ok.svg">
            </div>
            <div class="row-body">
                <div class="row-header">
                    <span>{{item.header}}</span>
                </div>
            </div>
        </div>`
});

/**
 * TITLE        : Component registration
 * DESCRIPTION  : Registers a component in a vue instance
 *
 */
Vue.component('planner-stack', {
    props: ['item', 'user', 'index'],
    template: `
                <div class="row-item">
                    <div class="row-header">
                        <span class="violet" v-if="item.user.id === user.id">{{item.user.display_name}}</span>
                        <span v-else>Исполнитель</span>
                        <span>{{item.collection[item.collection.length - 1].datetime}}</span>
                    </div>
                    <div class="row-body" v-for="(value, key) in item.collection">
                        <div class="row-text" v-if="!value.upload.length">
                            <span>{{value.body}}</span>
                        </div>
                        <div class="row-list" v-if="value.upload.length">
                            <span>{{value.body}}</span>
                            <li v-for="(file, index) in value.upload" v-if="file.type.match(/image*/)">
                                <img class="img" v-if="file.thumb_xs" v-bind:src="file.thumb_xs"></img>
                                <img class="img" v-else-if="file.thumb_sm" v-bind:src="file.thumb_sm"></img>
                                <img class="img" v-else v-bind:src="file.thumb"></img>
                            </li>
                            <li class="item-attachment" v-for="(file, index) in value.upload" v-if="!file.type.match(/image*/)">
                                <span class="label-icon"><i class="fa fa-file"></i></span>
                                <span class="label-text">
                                    <span>{{file.original_name}}</span> 
                                    <small>{{file.size}}</small>
                                </span>
                            </li>
                        </div>
                    </div>
                </div>`
})

/**
 * TITLE        : Component registration
 * DESCRIPTION  : Registers a component in a vue instance
 *
 */
Vue.component('view-file', {
    props: ['item', 'tmp', 'arr'],
    methods: {
        close(id, tmp, arr) {
            vue.previewRemove(id, tmp, arr)
        }
    },
    template: `<div class="in-preview-item">
                    <div class="in-item">
                        <div class="in-preview-src" v-if="item.blob">
                            <img v-bind:src="item.blob">
                        </div>
                        <div class="in-preview-file" v-else>
                            <span class="label-icon"><i class="fa fa-file"></i></span>
                            <span class="label-name">{{item.name}}</span>
                            <span class="label-size">{{item.size}}</span>
                        </div>
                        <div class="in-preview-close" v-if="item.status === 1" @click="close(item.id, tmp, arr)">
                            <img src="img/ic-close.svg"/>
                        </div>
                        <div class="in-preview-preloader" v-else>
                            <span><i class="fa fa-circle-o-notch fa-spin fa-fw"></i></span>
                        </div>
                    </div>
                </div>`
})