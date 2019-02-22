<template>
    <div class="chat-footer__block p-a b-t dark-white">
        <div class="input-group-message">
            <span class="input-group-upload">
                <button class="btn no-bg no-shadow default-icon" type="button">
                    <input class="input-hidden-file" type="file" name="uploadFiles" id="in-upload-input" value="Upload" multiple @change="initializeUploadFile($event)">
                    <i class="fa fa-paperclip"></i>
                </button>
            </span>
            <textarea type="text" class="form-control no-border" placeholder="Введите сообщение" style="resize: none;" v-model.trim="message" autocomplete="false" @keydown.enter="sendMessage"></textarea>
            <span class="input-group-send">
                <button class="btn no-bg no-shadow info-icon" type="button" @click="sendMessage">
                    <i class="fa fa-send"></i>
                </button>
            </span>
        </div>
        <div class="input-group-preview" ref="previews">
            <Attachment
                    v-for="(p, idx) in previews"
                    :item="p"
                    :key="idx"
            ></Attachment>
        </div>
    </div>
</template>

<script>
    import axios from '../../../config'

    const settings = {
        notice: {
            error_upload: 'Во время загрузки файлов произошла ошибка...'
        }
    }

    export default {
        props: ['user'],
        data() {
            return {
                message: '',
                uploads: [],
                previews: []
            }
        },
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
            initializeUploadFile(event) {

                let i = 0;
                let this_clone  = this;

                const upload = function(i)  {

                    let objectPreview               = {};
                    let objectHeader                = {};
                    let data                        = new FormData();
                    let random                      = Math.random().toString(16).slice(2);

                    objectHeader.onUploadProgress   = this_clone.uploadProgress(this_clone);
                    objectHeader.headers            = {'Content-Type': 'application/x-www-form-urlencoded'};

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

                    axios().post('upload/loading?transport=uploads&sid='+random+'', data, objectHeader)
                        .then(function (response) {
                            if(response.status === 200){

                                this_clone.previews[this_clone.previews.length - 1].status = 1;
                                this_clone.previews[this_clone.previews.length - 1].id     = response.data.attachment.id;

                                this_clone.uploads.push(response.data.attachment);

                                i++;

                                if (i < event.target.files.length) {
                                    upload(i);
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
            uploadProgress(this_clone) {
                return function (progress) {

                    let percentage = Math.floor((progress.loaded * 100)/progress.total);
                    this_clone.previews[this_clone.previews.length - 1].progress = percentage;
                    if(this_clone.bar) {
                        this_clone.bar.set(percentage);
                    }

                }
            }
        }
    }
</script>