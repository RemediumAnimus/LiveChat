<template>
    <div class="message-stack"
         :class="{'mess-in'  : item.user.roles === 'GUEST',
                     'mess-out' : item.user.roles === 'BOOKER',
                     'error'    : item.success    === false
                    }"
    >
        <div class="message-stack-photo" v-if="item.user.roles === 'GUEST'">
            <span class="w-40 avatar img-circle">{{item.user.short_name}}</span>
        </div>
        <div class="message-stack-content">
            <div class="in-message" v-for="(value, key) in item.collection" v-bind:data-msgid="value.stack_id">
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
        </div>
        <div class="message-stack-photo" v-if="item.user.roles === 'BOOKER'">
            <span class="w-40 avatar img-circle">{{item.user.short_name}}</span>
        </div>
    </div>
</template>

<script>
    export default {
        props: ['item', 'user', 'index'],
        inheritAttrs: false,
        methods: {
            selectedMessage(id) {
                let objectItem = this.$parent.selected.find(e => e.id === id);

                if(objectItem) {
                    $(event.target).closest('.in-message').removeClass('in-message_selected');
                    this.$parent.selected = this.$parent.selected.filter(e => e.id !== id);
                } else {
                    $(event.target).closest('.in-message').addClass('in-message_selected');
                    this.$parent.selected.push({id: id});
                }
            }
        },
        created() {

        }
    }
</script>