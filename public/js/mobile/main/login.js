'use strict';

const vue = new Vue({
    el: '#app',
    data: {
        username: '',
        password: '',
        warning:  '.label-warning'
    },
    methods: {
        login() {

            // Receive values ​​with the incoming form
            let data = new FormData();
                data.append('username', this.$refs.username.value);
                data.append('password', this.$refs.password.value);

            // Sends authorization request
            axios.post('login', data)
                 .then(response => {
                    if(response.status === 200)
                    {
                        if(response.data.status)
                            vue.successAuth();
                        else
                            vue.errorAuth();
                    }
                 }).catch(error => {
                     vue.errorAuth(error);
                 })
        },
        errorAuth() {
            $(this.warning).show();
        },
        successAuth() {
            $(this.warning).fadeOut('slow', function() {
               window.location = "/chat"
            });
        }

    }
})