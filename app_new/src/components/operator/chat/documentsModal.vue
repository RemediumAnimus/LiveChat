<template>
    <div class="modal fade inactive modal-window-xl" id="profile-document" data-backdrop="false" aria-hidden="true">
        <div class="modal-right w-xl white b-l">
            <div class="row-col">
                <a data-dismiss="modal" class="pull-right text-muted text-lg p-a-sm m-r-sm">×</a>
                <div class="modal-header p-a b-b">
                    <span class="h5">Документы</span>
                </div>
                <div class="row-row">
                    <div class="row-body">
                        <div class="row-center-profile" v-if="profile.documents.loading === 0">
                            <i class="fa fa-circle-o-notch fa-spin fa-fw"></i>
                        </div>
                        <div class="list list-group-document inset" v-else-if="profile.documents.loading === 1" ref="profile.documents.collection">
                            <ProfileFile
                                    v-for="(item, idx) in profile.documents.collection"
                                    :item="item"
                                    :key="idx"
                            ></ProfileFile>
                        </div>
                        <div class="row-center-profile" v-else-if="profile.documents.loading === 2">
                            <span><i class="fa fa-file"></i></span>
                            <small class="block text-muted">
                                Вложения отсутствуют
                            </small>
                        </div>
                        <div class="row-center-profile" v-else="profile.documents.loading === 3">
                            <small class="block text-muted">
                                Произошла ошибка при загрузке вложений.
                            </small>
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