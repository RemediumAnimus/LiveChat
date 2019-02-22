<template>
    <div>
        <div class="p-x m-t p-v-xs _600">{{item.datetime}}</div>
        <div class="item">
            <div class="row no-gutter">
                <div class="col-xs-4" v-for="(image, index) in item.uploads">
                    <a v-bind:href="image.thumb_xs ? image.thumb_xs : image.thumb_sm ? image.thumb_sm : image.thumb" data-toggle="lightbox" data-gallery="example-gallery" class="col-sm-4 w-full">
                        <img v-bind:src="image.thumb_xs ? image.thumb_xs : image.thumb_sm ? image.thumb_sm : image.thumb" class="w-full img-fluid">
                    </a>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        props: ['item']
    }
</script>