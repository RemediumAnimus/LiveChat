<template>
    <div class="in-preview-upload">
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
    </div>
</template>

<script>
    import axios from '../../../config'
    export default {
        props : ['item'],
        methods: {
            previewRemove(id) {

                // Get information attachment
                let object = this.$parent.uploads.find(u => u.id === id);

                // Clear information from array
                this.$parent.previews = this.$parent.previews.filter(u => u.id !== id);
                this.$parent.uploads  = this.$parent.uploads.filter(u => u.id !== id);

                // Delete attachments from date base
                axios().post('uploads/delete?transport=uploads', {'id': id, 'room': this.$parent.user.room, 'name': object.name, 'ext': object.ext})
                    .then(response => {
                        if(response.status === 200) {

                        }
                    })
                    .catch(error => {
                        console.log(error);
                    })
            }
        }
    }
</script>