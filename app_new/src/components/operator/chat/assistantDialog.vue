<template>
    <div class="list-item ">
        <div class="list-left">
            <span class="w-40 avatar w-orange img-circle">{{item.short_name}}</span>
        </div>
        <div class="list-body">
            <div class="item-title">
                <span class="_500">{{item.display_name}}</span>
            </div>
            <small class="block text-muted text-ellipsis">
                {{item.email}}
            </small>
        </div>
    </div>
</template>

<script>
    export default {
        created() {

        },
        methods: {

        }
    }
</script>