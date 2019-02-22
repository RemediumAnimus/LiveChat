<template>
    <div class="chat-page">
        <!-- aside -->
        <div id="aside" class="app-aside fade nav-dropdown black">

            <!-- fluid app aside -->
            <div class="navside dk" data-layout="column">
                <div class="navbar no-radius">
                    <!-- brand -->
                    <a href="index.html" class="navbar-brand">
                        <div data-ui-include="'img/logo.svg'"></div>
                        <img src="img/logo.svg" alt="." class="">
                        <span class="hidden-folded inline">Клиенты ГБА</span>
                    </a>
                    <!-- / brand -->
                </div>
                <div data-flex class="hide-scroll">
                    <nav class="scroll nav-stacked nav-stacked-rounded nav-color">
                        <ul class="nav" data-ui-nav>
                            <li class="nav-header hidden-folded">
                                <span class="text-xs">Основные</span>
                            </li>
                            <li class="active">
                                <a href="#" class="b-info">
							  <span class="nav-icon text-white no-fade">
								<i class="ion-chatbubble-working"></i>
							  </span>
                                    <span class="nav-text">Чат</span>
                                </a>
                            </li>
                            <li>
                                <a href="#" class="b-default">
							  <span class="nav-icon">
								<i class="ion-gear-b"></i>
							  </span>
                                    <span class="nav-text">Настройки</span>
                                </a>
                            </li>
                        </ul>
                    </nav>
                </div>
                <div data-flex-no-shrink>
                    <div class="nav-fold">
                        <div class="pull-right text-sm text-muted">v 1.0.1</div>
                        <span class="text-sm text-muted">Главбух Ассистент</span>
                    </div>
                </div>
            </div>
        </div>
        <!-- / -->
        <div id="content" class="app-content box-shadow-z2 pjax-container" role="main">

            <div class="app-body">
                <ChatPreloader v-if="loading.startBox === 0" />

                <div class="app-body-inner hide">
                    <div class="row-col">
                        <div class="app-container-col">
                            <UsersList
                                    :usersList = "usersList"
                                    :user      = "user"
                                    :loading   = "loading"
                                    :search    = 'search'
                                    :messages  = "messages">
                            </UsersList>
                            <Chat
                                    :loading   = "loading"
                                    :user      = "user"
                                    :messages  = "messages"
                                    :profile   = "profile">
                            </Chat>
                        </div>
                    </div>
                </div>
                <!-- Modal Images -->
                <ImagesModal :profile = "profile"></ImagesModal>
                <!-- / -->

                <!-- Modal documents -->
                <DocumentsModal :profile = "profile"></DocumentsModal>
                <!-- / -->

                <!-- Modal Taskmanager -->
                <TaskmanagerModal :profile = "profile" :user = "user"></TaskmanagerModal>
                <!-- / -->

                <!-- END MODAL -->
            </div>
        </div>
    </div>
</template>

<script>
    import axios from '../../../config'
    import Router from 'vue-router'
    import methods from '../../../store/operator'

    export default {
        data() {
            return {
                profile     : {
                    assistants  : [],
                    user        : {},
                    images      : {
                        offset      : 0,
                        loading     : 0,
                        collection  : []
                    },
                    documents   : {
                        offset      : 0,
                        loading     : 0,
                        collection  : []
                    }
                },
                messages    : [],
                search      : '',
                user        : {},
                users       : [],
                usersList   : [],
                loading      : {
                    innerBox     : 0,
                    startBox     : 0,
                    messageBox   : 0
                }
            }
        },
        methods: {
            initializeConnection: methods.initializeConnection,
            initializeSocket: methods.initializeSocket,
            scrollToBottom(node) {
                if(!node) return;
                setTimeout(() => {
                    node.scrollTop = node.scrollHeight
                })
            }
        },
        created() {
            // Get user information
            let that = this;
            axios().post('users/get?transport=users')
                .then(response => {
                    if(response.status === 200){
                        console.log('Пользовательские даные получены')

                        this.user = response.data;
                        this.initializeSocket(that);
                    } else {
                        window.location = "/"
                    }
                })
                .catch(error => {
                    console.error(error);
                })
        },
        mounted() {
            let this_clone = this;
            setTimeout(function() {
                this_clone.loading.startBox = 1;
                document.getElementsByClassName('app-body-inner')[0].classList.remove("hide");
            }, 1000);

            // Get list users
            axios().post('users/list?transport=users')
                .then(response => {
                    if(response.status === 200) {
                        console.log('Получен список пользователей')
                        this.usersList = response.data;
                        console.log(this.usersList);
                    }
                })
                .catch(error => {
                    console.log(error);
                })
        }
    }
</script>