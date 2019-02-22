<template>
    <!-- header -->
    <div class="list-users__top ">
        <div class="list-search__top">
            <form>
                <span class="btn btn-sm btn-icon rounded default-icon" data-toggle="modal" data-target="#aside"><i class="ion-navicon"></i></span>
                <div class="input-group b-a b-transparent">
                    <span class="search-group-btn">
                        <input type="text" class="form-control no-border" v-model.trim="search" placeholder="Введите имя пользователя">
                        <button class="btn no-bg no-shadow" type="button" v-show="search.length > 0" @click="search = ''">
                            <i class="ion-close-circled"></i>
                        </button>
                    </span>
                </div>
            </form>
        </div>
    </div>
    <!-- / -->
</template>

<script>
    export default {
        props: ['search']
    }
</script>