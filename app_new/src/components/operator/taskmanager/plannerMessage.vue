<template>
    <div class="message-stack"
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
    </div>
</template>

<script>
    export default {
        props: ['item','user']
    }
</script>