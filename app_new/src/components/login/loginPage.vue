<template>
    <div class="login-page">
        <div class="container">
            <div class="info">
                <h1>Клиенты ГБА</h1><span>Интерфейс обновлен от 15 февраля 2019г. <i class="fa fa-thumbs-o-up"></i></span>
            </div>
        </div>
        <div class="form">
            <div class="thumbnail"><img src="img/shape.svg"/></div>
            <form class="register-form">
                <input type="text" placeholder="Логин"/>
                <input type="password" placeholder="Пароль"/>
                <input type="text" placeholder="Электронный адрес"/>
                <button>Зарегистрироваться</button>
                <p class="message">Уже зарегистрированы? <a @click="showForm()">Войти в аккаунт</a></p>
            </form>
            <form class="login-form" @submit.prevent="login()">
                <input type="text" ref="username" placeholder="Логин"/>
                <input type="password"  ref="password"placeholder="Пароль"/>
                <button type="submit">Войти</button>
                <p class="message">Не зарегистрированы? <a @click="showForm()">Создать аккаунт</a></p>
            </form>
            <LoginFormOperator></LoginFormOperator>
            <LoginFormClient1></LoginFormClient1>
            <LoginFormClient2></LoginFormClient2>
        </div>
    </div>
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
            },
            showForm() {
                $('form').animate({height: "toggle", opacity: "toggle"}, "slow");
            }
        }
    }
</script>
