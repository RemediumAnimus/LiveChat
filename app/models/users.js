'use strict';

const mysql             = require('../database');
const sql               = require('sqlstring');
const OPERATOR_ROLES    = 'BOOKER';
const CLIENT_ROLES      = 'GUEST';

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
    return userModel.filter(u => u.roles === CLIENT_ROLES)
}

/**
 *  Get by lists users
 *
 */
const getByList = function (done) {

    let queryString = 'SELECT   u.`id`,                                           ' +
        '                       u.`name`,                                         ' +
        '                       r.`id` AS `room`,                                 ' +
        '                       u.`roles`,                                         ' +
        '                       m.`is_read`                                       ' +
        'FROM  users u                                                            ' +
        'INNER JOIN `rooms` r ON u.`id` = r.`id_user`                             ' +
        'INNER JOIN (select from_id, is_read from messages ORDER BY id DESC) as m ' +
        'WHERE u.`roles` = ?                                                      ' +
        'AND m.`from_id` = u.`id`                                                 ' +
        'GROUP BY u.id'
    ;

    mysql.query(sql.format(queryString, ['GUEST']), function(err, result){
        if (err)
            return done(err);
        if (!result.length) {
            return done(null, false);
        }

        result.forEach(function(index, elem) {
            if (!index.is_read) {
                index.notify = true;
            } else {
                index.notify = false;
            }

            index.online = false;
            index.current = false;
        });

        // All is well, return successful user
        return done(null, result);
    });
}

const updateUserMessage = function (collection, done) {
    let queryString = 'update messages as m ' +
        'set m.`is_read` = 1                ' +
        'where m.`is_read` = 0              ' +
        'and m.`from_id` = ?                ';

    mysql.query(sql.format(queryString, collection.id_user), function(err, result){
        return done(null, result);
    });
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
    getAllUsers,
    updateUserMessage
};