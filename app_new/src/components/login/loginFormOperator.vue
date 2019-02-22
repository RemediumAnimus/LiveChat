<template>
    <form class="login-form-operator" @submit.prevent="login">
        <input ref="username" type="hidden" value="operator">
        <input ref="password" type="hidden" value="12345">
        <button class="btn" type="submit">Оператор</button>
    </form>
</template>

<script>
    import axios from '../../config'
    import Router from 'vue-router'
    export default {
        created() {

        },
        methods: {
            login () {
                this.username = this.$refs.username.value;
                this.password = this.$refs.password.value;

                axios().post('login', {'username': this.username,
                    'password': this.password
                }).then(response => {
                    if(response.status == 200)
                    {
                        window.location = "/chat"
                    } else {
                        alert('No Authorized!')
                    }
                }).catch(error => {
                    console.error(error);
                })
            }
        }
    }
</script>