'use strict';

const mysql             = require('../database');
const config            = require('../config');
const sql               = require('sqlstring');

let userModel = [];


/**
 * Creates a new user
 *
 */
const add = function (id, user_id, name, room, roles){
    userModel.push({
        'socket_id' : id,
        'id'        : user_id,
        'name'      : name,
        'room'      : room,
        'roles'     : roles,
        'notify'    : false,
        'current'   : false
    })
}

/**
 * Gets user data
 *
 */
const get = function (id) {
    return userModel.find(u => u.socket_id === id)
}

/**
 * Deletes user
 *
 */
const remove = function (id) {
    const user = get(id);
    if(user) {
        userModel = userModel.filter(u => u.socket_id !== user.socket_id)
    }
    return user;
}

/**
 *  Getting a user's room
 *
 */
const getByRoom = function (room) {
    return userModel.filter(u => u.room === room)
}

/**
 *  Getting all list users (client)
 *
 */
const getAllUsers = function () {
    return userModel.filter(u => u.roles === config.chat.roles.client)
}

/**
 *  Get by lists users
 *
 */
const getByList = function (done) {

    let queryString = 'SELECT   u.`id`,                                           ' +
        '                       u.`name`,                                         ' +
        '                       r.`id` AS `room`,                                 ' +
        '                       u.`roles`,                                        ' +
        '                       m.`is_read`                                       ' +
        'FROM  users u                                                            ' +
        'INNER JOIN `rooms` r ON u.`id` = r.`id_user`                             ' +
        'LEFT  JOIN (SELECT from_id, is_read FROM messages ORDER BY id DESC) AS m ' +
        'ON m.`from_id` = u.`id`                                                  ' +
        'WHERE u.`roles` = ?                                                      ' +
        'GROUP BY u.id'
    ;

    mysql.query(sql.format(queryString, ['GUEST']), function(err, result){
        if (err)
            return done(err);
        if (!result.length) {
            return done(null, false);
        }

        result.forEach(function(index, elem) {
            if (!index.is_read && index.is_read !== null) {
                index.notify = true;
            } else
                index.notify = false;

            index.online = false;
            index.current = false;
        });

        // All is well, return successful user
        return done(null, result);
    });
}

const updateUserMessage = function (collection, done) {
    if (collection.update_from_client) {
        let queryString = 'update messages as m ' +
            'set m.`is_read` = 1                ' +
            'where m.`is_read` = 0              ' +
            'and m.`room_id` = ?                ';

        mysql.query(sql.format(queryString, collection.id_room), function(err, result){
            return done(null, result);
        });
    } else {
        let queryString = 'update messages as m ' +
            'set m.`is_read` = 1                ' +
            'where m.`is_read` = 0              ' +
            'and m.`from_id` = ?                ';

        mysql.query(sql.format(queryString, collection.id_user), function(err, result){
            return done(null, result);
        });
    }
}

/**
 * A middleware allows user to get access to pages ONLY if the user is already logged in.
 *
 */
const isAuthenticated = function (req, res, next) {
    if(req.isAuthenticated()){
        next();
    } else {
        res.redirect('/');
    }
}

/**
 * A middleware allows user to get access to pages ONLY if the user is an operator.
 *
 */
const isOperator = function (req, done) {
    if(req.user.roles === config.chat.roles.operator){
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
    getAllUsers,
    updateUserMessage
};