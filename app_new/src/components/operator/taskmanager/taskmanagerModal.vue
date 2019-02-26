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
                            <p class="text-muted">Пожалуйста, заполните информацию, чтобы продолжить. Поля обязательные для заполнения отмечены знаком «<label class="label-required">*</label>»</p>
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
                            <form class="form" id="form-planner">
                                <div class="row m-b">
                                    <div class="col-sm-6">
                                        <label>Название задачи</label>
                                        <label class="label-required">*</label>
                                        <div class="box collapse in m-a-0">
                                            <input name="header" type="text" class="form-control no-border">
                                            <span class="info-danger" title="Поле обязательно для заполнения."><i class="ion-android-warning"></i></span>
                                        </div>
                                    </div>
                                    <div class="col-sm-6">
                                        <label>Срок задачи</label>
                                        <label class="label-required">*</label>
                                        <div class="box collapse in m-a-0">
                                            <input name="datetime" type="text" class="form-control no-border" v-bind="createDatePicker()">
                                            <span class="info-danger" title="Поле обязательно для заполнения."><i class="ion-android-warning"></i></span>
                                        </div>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label>Тип задачи</label>
                                    <label class="label-required">*</label>
                                    <div class="btn-flex">
                                        <planner-type
                                                v-for="(item, idx) in plannerInType"
                                                :item="item"
                                                :key="idx"
                                        ></planner-type>
                                    </div>
                                </div>
                                <div class="row m-b">
                                    <div class="col-sm-6">
                                        <label>Описание задачи</label>
                                        <label class="label-required">*</label>
                                        <div class="box collapse in m-a-0">
                                            <textarea name="description" class="form-control no-border" rows="6" placeholder="Введите описание задачи..."></textarea>
                                            <span class="info-danger" title="Поле обязательно для заполнения."><i class="ion-android-warning"></i></span>
                                        </div>
                                    </div>
                                    <div class="col-sm-6">
                                        <label>Комментарий к задаче</label>
                                        <label class="label-required">*</label>
                                        <div class="box collapse in m-a-0">
                                            <textarea name="comment" class="form-control no-border" rows="6" placeholder="Введите комментарий к задаче..."></textarea>
                                            <span class="info-danger" title="Поле обязательно для заполнения."><i class="ion-android-warning"></i></span>
                                        </div>
                                    </div>
                                </div>
                            </form>
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
                    <p class="label-error" v-show="plannerError">Выделенные поля для заполнения пропущены или заполнены неверно! Минимальная длина поля ввода составляет 3 символа.</p>
                    <div class="col-md-6 text-left p-l-0">
                        <button type="button" class="btn default p-x-md" data-dismiss="modal" @click="clearSelected()">Отменить</button>
                    </div>
                    <div class="col-md-6 p-r-0">
                        <button type="button" class="btn info p-x-md" @click="createPlanner()">Создать задачу</button>
                    </div>
                </div>
            </div><!-- /.modal-content -->
        </div>
    </div>
</template>

<script>
    export default {
        data() {
            return {
                plannerMessages: [],
                plannerInType    : [],
                plannerOneType   : '',
                plannerError     : false
            }
        },
        props: ['profile','user'],
        methods: {

            createPlanner() {

                let formData    = new FormData(),
                    this_clone  = this,
                    form        = $("#form-planner"),
                    header      = form.find('[name="header"]').val(),
                    data        = form.serializeArray();

                // Reset error message
                this.plannerError = false;

                // Check the field
                for(let i = 0; i < data.length; i++) {
                    if(!data[i].value || data[i].value.length < 3) {
                        this.plannerError = true;
                    } else
                        formData.append(data[i].name, data[i].value);

                }

                // Check the type
                if(!this.plannerOneType)
                    this.plannerError = true;

                // Refund if the error
                if(this.plannerError === true)
                    return;

                // Sort the selected messages
                for(let i = 0, m = []; i < this.selected.length; i ++) {
                    m[i] = this.selected[i].id;

                    if(i === this.selected.length - 1) {
                        formData.append('selected', JSON.stringify(m));
                    }
                }

                // Add data to send
                formData.append('type', this.plannerOneType);
                formData.append('user', this.profile.user.id);

                // Send to server
                axios().post('task/create?transport=task', formData)
                    .then(function (response) {
                        if(response.status === 200){
                            if(response.data.status) {
                                this_clone.createAmaran(settings.notice.success_planner, header);
                                this_clone.clearSelected();
                            }
                        }
                    })
                    .catch(error => {
                        this_clone.createAmaran(settings.notice.error_task_create, header);
                    })
            },
            createDatePicker() {
                $('[name="datetime"]').datetimepicker({
                    locale: 'ru',
                    format: 'YYYY-MM-DD HH:mm:ss'
                });
            },
            clearSelected() {
                this.plannerMessages = [];
                this.selected = [];
                this.plannerError = false;
                this.plannerOneType = '';
                $('.in-message').removeClass('in-message_selected');
                $('#form-planner').find("input[type=text], textarea").val('');
                $('#form-planner').find("button").removeClass('selected');
                $('#send-taskmanager').modal('hide');
            },
            createAmaran(notice, title) {

                $.amaran({
                    content:{
                        title   : notice,
                        message : title
                    },
                    theme:'tumblr'
                });

            }
        }
    }
</script>