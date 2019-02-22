<template>
    <div class="left-box-col aside-sm b-r" id="list">
        <div class="row-col dark-white">

            <Search :search = 'search'></Search>

            <!-- flex content -->
            <div class="list-users__list row-row">
                <div class="row-body scrollable hover">
                    <div class="row-inner">

                        <!-- left content -->
                        <AssistantItem
                                :usersList = "usersList"
                                :user = "user" :loading = "loading"
                                :messages = "messages"
                                :previews = "previews">
                        </AssistantItem>
                        <!-- / -->

                    </div>
                </div>
            </div>
            <!-- / -->

            <!-- footer -->
            <div class="list-footer__settings p-a b-t clearfix">
                <div class="dropdown dropup inline pull-right">
                    <a class="nav-link" data-toggle="dropdown" aria-expanded="false">
											<span class="btn btn-sm btn-icon default-icon rounded">
												<i class="fa fa-gear"></i>
											</span>
                    </a>
                    <div class="dropdown-menu">
                        <a class="dropdown-item" href="#">Активность<i class="fa fa-sort-amount-desc"></i></a>
                        <a class="dropdown-item" href="#">Активность<i class="fa fa-sort-amount-asc"></i></a>
                        <a class="dropdown-item" href="#">По алфавиту<i class="fa fa-sort-alpha-desc"></i></a>
                        <a class="dropdown-item" href="#">По алфавиту<i class="fa fa-sort-alpha-asc"></i></a>
                    </div>
                </div>
                <span class="text-sm text-muted">Настройки списка</span>
            </div>
            <!-- / -->

        </div>
    </div>
</template>

<script>
    export default {
        props: ['usersList','user','search','loading','messages','previews']
    }
</script>