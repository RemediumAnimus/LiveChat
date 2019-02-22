<template>
    <div class="inner-box-col">

        <div class="empty-box-col" v-if="loading.innerBox === 0">
            <i class="ion-chatbubbles"></i>
            <span>Пожалуйста, выберите диалог...</span>
        </div>
        <div class="view-box-col" v-else>
            <div class="box-inner-message" id="detail">
                <div class="flex-dir-col dark-white">

                    <!-- header -->
                    <div class="dark-white b-b">
                        <div class="navbar">

                            <!-- nabar right selected-->
                            <div class="navbar-selected" v-if="selected.length">
                                <ul class="nav navbar-nav navbar-message-selected pull-right m-l">
                                    <li class="nav-item">
                                        <a class="nav-link" data-toggle="tooltip" data-placement="bottom" title="Удалить">
														<span class="btn btn-sm btn-icon rounded default-icon">
															<i class="fa fa-trash"></i>
														</span>
                                        </a>
                                    </li>
                                    <li class="nav-item">
                                        <a class="nav-link" data-toggle="modal" data-target="#send-taskmanager" data-ui-toggle-class="zoom" data-ui-target="#animate-taskmanager" @click="openPlanner()">
                                            <span class="btn btn-sm info">Создать задачу</span>
                                        </a>
                                    </li>
                                </ul>
                                <div class="navbar-item navbar-message-count text-ellipsis">
                                    <span>{{selected.length}}</span>
                                    <span>{{declOfNum(selected.length)}}</span>
                                    <button class="btn in_deselect_all btn-sm" @click="clearSelected()">
                                        <i class="ion-close"></i>
                                    </button>
                                </div>
                            </div>
                            <!-- / navbar right -->

                            <!-- nabar right -->
                            <div class="navbar-usualy" v-else>
                                <ul class="nav navbar-nav navbar-message-default pull-right m-l">
                                    <li class="nav-item" @click="loadingMessage()">
                                        <a class="nav-link" data-toggle="tooltip" data-placement="bottom" title="Подгрузить">
                                            <span class="btn btn-sm btn-icon rounded info">
                                                <i class="fa fa-spinner"></i>
                                            </span>
                                        </a>
                                    </li>
                                    <li class="nav-item aside-lg" @click="profileShow = !profileShow">
                                        <a class="nav-link" data-toggle="tooltip" data-placement="bottom" title="Профиль">
                                            <span class="btn btn-sm btn-icon rounded default-icon">
                                                <i class="fa fa-ellipsis-v"></i>
                                            </span>
                                        </a>
                                    </li>
                                </ul>
                                <span class="navbar-item navbar-message-name text-ellipsis">
                                    {{profile.user.display_name}}
                                </span>
                            </div>
                            <!-- / navbar right -->
                        </div>
                    </div>
                    <!-- / -->

                    <!-- flex content -->
                    <div class="loading-body-message" v-if="loading.messageBox === 0">
                        <i class="fa fa-circle-o-notch fa-spin fa-fw"></i>
                    </div>

                    <div class="box-body-message" v-else-if="loading.messageBox === 1">
                        <div class="row-body">
                            <div class="row-inner">
                                <!-- content -->
                                <div class="box-message p-a-sm" ref="messages" :class="{'mode-selected': selected.length}">
                                    <Message
                                            v-for="(m, idx) in messages"
                                            :item="m"
                                            :user="user"
                                            :key="idx"
                                    ></Message>
                                </div>
                                <!-- / -->
                            </div>
                        </div>
                    </div>

                    <div class="loading-body-message" v-else>
                        <small class="block text-muted">
                            Здесь будет выводиться история переписки.
                        </small>
                    </div>
                    <InputMessage :message = 'message' :user = "user"></InputMessage>
                </div>
            </div>
            <div class="right-box-col aside-lg" id="profile" v-show="profileShow">
                <div class="row-col b-l">
                    <div class="header-profile__box box-shadow-info">
                        <div class="navbar">
                            <h6 class="text-muted m-a-0">Информация о клиенте</h6>
                        </div>
                        <ul class="list-group no-border">
                            <li class="list-group-item">
                                <span class="pull-left w-56 w-default img-circle text-md m-r">АК</span>
                                <div class="clear">
                                    <span class="_500 block">{{profile.user.display_name}}</span>
                                    <span class="text-muted text-ellipsis">{{profile.user.company}}</span>
                                </div>
                            </li>
                        </ul>
                    </div>
                    <div class="box-shadow-info">
                        <ul class="nav">
                            <li class="nav-item nav-hover">
                                <a class="nav-link block">
                                    <label class="md-switch pull-right">
                                        <input type="checkbox" checked="" class="has-value">
                                        <i class="blue"></i>
                                    </label>
                                    <i class="fa fa-bell m-r"></i>
                                    <span>Уведомления</span>
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div class="box-shadow-info">
                        <ul class="nav nav-profile-item">
                            <li class="nav-item nav-hover" data-toggle="modal" data-target="#profile-photo" @click="loadingPhoto(0)">
                                <a class="nav-link block">
                                    <i class="fa fa-image"></i>
                                    <span>Фотографии</span>
                                </a>
                            </li>
                            <li class="nav-item nav-hover" data-toggle="modal" data-target="#profile-document" @click="loadingFiles(0)">
                                <a class="nav-link block">
                                    <i class="fa fa-file"></i>
                                    <span>Документы</span>
                                </a>
                            </li>

                        </ul>

                    </div>
                    <div class="box-shadow-info info-footer-shadow row-row">
                        <div class="info-header">
                            <i class="fa fa-users m-r"></i>
                            <span class="m-a-0">Ассистенты беседы</span>
                        </div>
                        <div class="row-body scrollable hover">
                            <div class="row-inner p-b-2">

                                <!-- content -->
                                <div class="list inset list-operator__dialog p-b-3" ref="profile.assistants" v-if="profile.assistants.length">

                                    <AssistantList
                                            v-for="(user, idx) in profile.assistants"
                                            :item="user"
                                            :key="idx"
                                    ></AssistantList>
                                </div>
                                <!-- / -->

                                <div class="info-header" v-else>
                                    <small class="block text-muted">
                                        Список ассистентов беседы пуст.
                                    </small>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
                <!-- / -->
            </div>
        </div>
    </div>
</template>

<script>
    import axios from '../../../config'
    export default {
        data() {
            return {
                offsetMessage: 0,
                profileShow  : false,
                selected: []
            }
        },
        props: ['loading', 'message','user','messages','profile'],
        methods: {
            sendMessage() {

                if(this.message.length === 0) {
                    if(this.uploads.length === 0)
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

                // Sending a new message
                this.$socket.emit('message:create', message, err => {
                    if (err) {
                        console.error(err)
                    } else {
                        this.message  = '';
                        this.uploads  = [];
                        this.previews = [];
                    }
                })
            },
            loadingMessage() {
                let $this           = this;
                this.offsetMessage  = this.offsetMessage + 10;

                axios().post('messages/all?transport=messages', {'room_id': this.user.room, 'offset': this.offsetMessage})
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
            loadingPhoto(trigger) {

                if(this.profile.images.collection.length && !trigger) {
                    return;
                }

                this.profile.images.offset = trigger ? this.profile.images.offset + 10 : 0;

                // Load photos for profile
                axios().post('uploads/get?transport=uploads&type=image', {'room': this.user.room, offset: this.profile.images.offset})
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
            loadingFiles(trigger) {

                if(this.profile.documents.collection.length && !trigger) {
                    return;
                }

                this.profile.documents.offset = trigger ? this.profile.documents.offset + 10 : 0;

                // Load photos for profile
                axios().post('uploads/get?transport=uploads&type=document', {'room': this.user.room, offset: this.profile.documents.offset})
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

                console.log(this.plannerMessages)
            },
            declOfNum(number) {
                let titles = ['сообщение', 'сообщения', 'сообщений'];
                let cases = [2, 0, 1, 1, 1, 2];
                return titles[ (number%100>4 && number%100<20)? 2 : cases[(number%10<5)?number%10:5] ];
            }
        }
    }
</script>