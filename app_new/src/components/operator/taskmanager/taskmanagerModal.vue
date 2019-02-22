<template>
    <div class="modal fade animate black-overlay modal-window-inner" id="send-taskmanager" data-backdrop="true" data-ui-class="zoom" aria-hidden="true">
        <div class="modal-dialog modal-window-lg" id="animate-taskmanager">
            <div class="modal-content">
                <div class="modal-header">
                    <h6 class="modal-title">Создать задачу</h6>
                </div>
                <div class="modal-body modal-body-task">
                    <div class="box no-shadow">
                        <div class="box-body">
                            <p class="text-muted">Пожалуйста, заполните информацию, чтобы продолжить</p>
                            <div class="row m-b">
                                <div class="col-sm-6">
                                    <label>От клиента</label>
                                    <div class="p-b">
                                        <div class="list-left">
                                            <span class="w-40 avatar w-default img-circle">{{profile.user.short_name}}</span>
                                        </div>
                                        <div class="list-body">
                                            <div class="item-title">
                                                <span class="_500">{{profile.user.display_name}}</span>
                                            </div>
                                            <small class="block text-muted text-ellipsis">
                                                {{profile.user.company}}
                                            </small>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-sm-6">
                                    <label>Постановщик задачи</label>
                                    <div class="p-b">
                                        <div class="list-left">
                                            <span class="w-40 avatar w-default img-circle">{{user.short_name}}</span>
                                        </div>
                                        <div class="list-body">
                                            <div class="item-title">
                                                <span class="_500">{{user.display_name}}</span>
                                            </div>
                                            <small class="block text-muted text-ellipsis" v-if="user.company">
                                                {{user.company}}
                                            </small>
                                            <small class="block text-muted text-ellipsis" v-else>
                                                Компания не задана
                                            </small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="row m-b">
                                <div class="col-sm-6">
                                    <label>Название задачи</label>
                                    <div class="box collapse in m-a-0">
                                        <input type="text" class="form-control no-border">
                                    </div>
                                </div>
                                <div class="col-sm-6">
                                    <label>Срок задачи</label>
                                    <div class="box collapse in m-a-0">
                                        <input type="text" class="form-control has-value no-border" data-ui-jp="datetimepicker">
                                    </div>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Тип задачи</label>
                                <div class="btn-flex">
                                    <button class="btn btn-type-task m-b-sm selected"><i class="fa fa-plus pull-left"></i>Подготовить документы</button>
                                    <button class="btn btn-type-task m-b-sm"><i class="fa fa-plus pull-left"></i>Обработать документы</button>
                                    <button class="btn btn-type-task m-b-sm"><i class="fa fa-plus pull-left"></i>Клиентский запрос</button>
                                </div>
                            </div>
                            <div class="row m-b">
                                <div class="col-sm-6">
                                    <label>Описание задачи</label>
                                    <div class="box collapse in m-a-0">
                                        <textarea class="form-control no-border" rows="6" placeholder="Введите описание задачи..."></textarea>
                                    </div>
                                </div>
                                <div class="col-sm-6">
                                    <label>Комментарий к задаче</label>
                                    <div class="box collapse in m-a-0">
                                        <textarea class="form-control no-border" rows="6" placeholder="Введите комментарий к задаче..."></textarea>
                                    </div>
                                </div>
                            </div>
                            <div class="row m-b">
                                <div class="col-sm-6">
                                    <label>Прикрепленные сообщения</label>
                                    <div class="box-message" v-if="plannerMessages.length">
                                        <PlannerMessage
                                                v-for="(item, idx) in plannerMessages"
                                                :item="item"
                                                :key="idx"
                                        ></PlannerMessage>
                                    </div>
                                </div>
                                <div class="col-sm-6">
                                    <label>Прикрепленные файлы</label>
                                    <div class="box-attachment" v-if="plannerMessages.length">
                                        <PlannerAttachment
                                                v-for="(item, idx) in plannerMessages"
                                                :item="item"
                                                :key="idx"
                                        ></PlannerAttachment>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn danger p-x-md" data-dismiss="modal">Отменить</button>
                    <button type="button" class="btn info p-x-md" data-dismiss="modal">Создать задачу</button>
                </div>
            </div><!-- /.modal-content -->
        </div>
    </div>
</template>

<script>
    export default {
        data() {
            return {
                plannerMessages: []
            }
        },
        props: ['profile','user']
    }
</script>