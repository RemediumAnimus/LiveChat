<template>
    <div>
        <div class="p-x m-t p-v-xs _600">{{item.datetime}}</div>
        <div class="list-item" v-for="(file, index) in item.uploads">
            <div class="list-left">
                    <span class="w-56 avatar">
                        <img alt="." src="img/a3.jpg">
                    </span>
            </div>
            <div class="list-body">
                <a href="#" class="text-ellipsis _500">{{file.original_name}}</a>
                <span class="clear text-muted text-ellipsis text-xs">{{file.size}}</span>
                <span class="clear text-muted text-ellipsis text-xs p-t-xs">{{file.fulltime}}</span>
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        props: ['item']
    }
</script>