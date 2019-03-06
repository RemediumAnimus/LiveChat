'use strict';

const vue = new Vue({
    el: '.login-form',
    data: {
        username: '',
        password: ''
    },
    methods: {
        login() {

            // Receives values ​​with the incoming form
            this.username = this.$refs.username.value;
            this.password = this.$refs.password.value;

            // Sends authorization request
            axios.post('auth', {'username': this.username,
                                 'password': this.password
            }).then(response => {

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
            window.location = "/chat";
        },
        showForm() {
            $('form').animate({height: "toggle", opacity: "toggle"}, "slow");
        }
    }
})

new Vue({
    el: '.register-form',
    methods: {
        showForm() {
            $('form').animate({height: "toggle", opacity: "toggle"}, "slow");
        }
    }
})
