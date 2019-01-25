'use strict';

var mysql = require('../database');
var userModel = [];
var OPERATOR_ROLES = 'BOOKER';
var CLIENT_ROLES = 'GUEST';

/**
 * Creates a new user
 *
 */
var add = function (id, user_id, name, room, roles){
    userModel.push({
        'socket': {
            id
        },
        'attributes': {
            'id': user_id, name, room, roles
        }
    })
}

/**
 * Gets user data
 *
 */
var get = function (id) {
    return userModel.find(u => u.socket.id === id)
}

/**
 * Deletes user
 *
 */
var remove = function (id) {
    const user = get(id);
    if(user) {
        userModel = userModel.filter(u => u.socket.id !== user.socket.id)
    }
    return user;
}

/**
 *  Getting a user's room
 *
 */
var getByRoom = function (room) {
    return userModel.filter(u => u.attributes.room === room)
}

/**
 *  Getting all list users (client)
 *
 */
var getAllUsers = function () {
    return userModel.filter(u => u.attributes.roles === CLIENT_ROLES)
}

/**
 *  Get by lists users
 *
 */
var getByList = function (done) {
    mysql.query("SELECT `id`, `name` FROM `users` WHERE `roles` = 'GUEST'", function(err,rows){
        if (err)
            return done(err);
        if (!rows.length) {
            return done(null, false);
        }

        rows.forEach(function(index, elem) {
            index.online = false;
        });

        // All is well, return successful user
        return done(null, rows);
    });
}

/**
 * A middleware allows user to get access to pages ONLY if the user is already logged in.
 *
 */
var isAuthenticated = function (req, res, next) {
    if(req.isAuthenticated()){
        next();
    } else{
        res.redirect('/');
    }
}

/**
 * A middleware allows user to get access to pages ONLY if the user is an operator.
 *
 */
var isOperator = function (req, done) {
    if(req.user.roles === OPERATOR_ROLES){
        return done(null);
    } else {
        return done('Access is denied!');
    }
}

module.exports = {
    add,
    get,
    remove,
    getByRoom,
    getByList,
    isAuthenticated,
    isOperator,
    getAllUsers
};