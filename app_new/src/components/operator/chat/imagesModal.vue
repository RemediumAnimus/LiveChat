<template>
    <div class="modal fade inactive modal-window-xl" id="profile-photo" data-backdrop="false" aria-hidden="true">
        <div class="modal-right w-xl white b-l">
            <div class="row-col">
                <a data-dismiss="modal" class="pull-right text-muted text-lg p-a-sm m-r-sm">×</a>
                <div class="modal-header p-a b-b">
                    <span class="h5">Фотографии</span>
                </div>
                <div class="row-row">
                    <div class="row-body">
                        <div class="row-inner">
                            <div class="row-center-profile" v-if="profile.images.loading === 0">
                                <i class="fa fa-circle-o-notch fa-spin fa-fw"></i>
                            </div>
                            <div class="list-group list-group-images no-radius no-borders" v-else-if="profile.images.loading === 1">
                                <div class="list inset list-operator__dialog p-b-3" ref="profile.images.collection">
                                    <ProfileImage
                                            v-for="(item, idx) in profile.images.collection"
                                            :item="item"
                                            :key="idx"
                                    ></ProfileImage>
                                </div>
                            </div>
                            <div class="row-center-profile" v-else-if="profile.images.loading === 2">
                                <span><i class="fa fa-image"></i></span>
                                <small class="block text-muted">
                                    Вложения отсутствуют
                                </small>
                            </div>
                            <div class="row-center-profile" v-else="profile.images.loading === 3">
                                <small class="block text-muted">
                                    Произошла ошибка при загрузке вложений.
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        props: ['profile']
    }
</script>