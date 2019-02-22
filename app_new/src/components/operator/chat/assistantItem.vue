<template>
    <div class="list inset" data-ui-list="info">
        <div class="list-item"
             v-for="u in usersList"
             :class="{'active info': u.attributes.current, 'notify': u.attributes.notify}"
             @click="initializeRoom(u, $event)"
        >
            <div class="list-left">
                <span class="w-40 avatar w-default img-circle">{{u.short_name}}<i class="on b-white bottom" v-if="u.attributes.online"></i></span>
            </div>
            <div class="list-body">
														<span class="label" v-if="u.attributes.unread">
															{{u.attributes.unread}}
														</span>
                <div class="item-title">
                    <span class="_500">{{u.display_name}}</span>
                </div>
                <small class="block text-muted text-ellipsis">
                    {{u.company}}
                </small>
            </div>
        </div>
    </div>
</template>

<script>
    import axios from '../../../config'
    import Router from 'vue-router'

    export default {
        props: ['usersList','user','loading','messages'],
        methods: {
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

                this.$socket.emit('message:update', {user: data, update_from: true});

                this.getProfileAssistant(data.room, data.id);

                this.$socket.emit('join', this.user, data => {

                    if (typeof data === 'string') {
                        console.error(data)
                    }
                    else {

                        while(this.messages.length > 0) this.messages.pop()
                        this.loading.innerBox = 1;

                        axios().post('messages/all?transport=messages', {'room_id': this.user.room, 'in_upload': true})
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
                                        this_clone.scrollToBottom(this_clone.$refs.messages)
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
                $('.modal-window-xl').modal('hide');

            },
            getProfileAssistant(room_id, user_id) {
                axios().post('users/profile?transport=users', {id_user: user_id, id_room: room_id})
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
            scrollToBottom(node) {
                if(!node) return;
                setTimeout(() => {
                    node.scrollTop = node.scrollHeight
                })
            }
        }
    }
</script>