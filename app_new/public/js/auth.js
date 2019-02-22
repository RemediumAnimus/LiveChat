'use strict';

new Vue({
    el: '.login-form-operator',
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
            axios.post('login', {'username': this.username,
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
})



new Vue({
    el: '.login-form-client1',
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
            axios.post('login', {'username': this.username,
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
})

new Vue({
    el: '.login-form-client2',
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
            axios.post('login', {'username': this.username,
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
})