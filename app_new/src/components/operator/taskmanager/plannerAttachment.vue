<template>
    <div>
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
    </div>
</template>

<script>
    export default {
        props: ['item','user']
    }
</script>