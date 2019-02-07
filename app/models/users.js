'use strict';

/**
 * DESCRIPTION  : Declares variables
 *
 */
const mysql             = require('../database');
const config            = require('../config');
const sql               = require('sqlstring');

let userModel = [];

/**
 * TITLE        : User method
 * DESCRIPTION  : Creates a new user
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
 * TITLE        : User method
 * DESCRIPTION  : Gets user data
 *
 */
const get = function (id) {
    return userModel.find(u => u.socket_id === id)
}

/**
 * TITLE        : User method
 * DESCRIPTION  : Delete`s user
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
 * TITLE        : User method
 * DESCRIPTION  : Getting a user's room
 *
 */
const getByRoom = function (room) {
    return userModel.filter(u => u.room === room)
}

/**
 * TITLE        : User method
 * DESCRIPTION  : Getting all list users (client)
 *
 */
const getAllUsers = function () {
    return userModel.filter(u => u.roles === config.chat.roles.client)
}

/**
 * TITLE        : User method
 * DESCRIPTION  : Get by lists users
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

/**
 * TITLE        : User method
 * DESCRIPTION  : Update message
 *
 */
const updateUserMessage = function (collection, done) {

    let queryString = 'UPDATE messages as m  ' +
        'SET    m.`is_read`     = 1          ' +
        'WHERE  m.`is_read`     = 0          ' +
        'AND    m.`from_id`     = ?          ' ;

    mysql.query(sql.format(queryString, collection.id_user), function(err, result){
        return done(null, result);
    });
}

/**
 * TITLE        : User method
 * DESCRIPTION  : A middleware allows user to get access to pages ONLY if the user is already logged in
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
 * TITLE        : User method
 * DESCRIPTION  : A middleware allows user to get access to pages ONLY if the user is an operator
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