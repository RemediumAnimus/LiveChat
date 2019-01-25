'use strict';

new Vue({
    el: '.login-form',
    data: {
        username: '',
        password: ''
    },
    methods: {
        login() {

            // Receives values ​​with the incoming form
            this.username = this.$refs.username.value;
            this.password = this.$refs.room.value;

            // Sends authorization request
            axios.post('login', {'username': this.username,
                                 'password': this.password
            }).then(response => {
                if(response.status == 200)
                {
                    window.location = "/chat"
                }
            }).catch(error => {
                console.log(error);
            })
        }
    }
})