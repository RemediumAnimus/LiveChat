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
const add = function (socket_id, data){

    userModel.push({
        'socket_id'         : socket_id,
        'id'                : data.id,
        'email'             : data.email,
        'first_name'        : data.first_name,
        'last_name'         : data.last_name,
        'company'           : data.company,
        'display_name'      : data.display_name,
        'short_name'        : data.short_name,
        'room'              : data.room,
        'roles'             : data.roles,
        'attributes'        : {
            'unread'            : 0,
            'current'           : false
        }
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
 * DESCRIPTION  : Gets user data
 *
 */
const addSystem = function () {
    let queryString = 'SELECT   u.`id`,           ' +
        '                       u.`first_name`,   ' +
        '                       u.`last_name`,    ' +
        '                       u.`roles`         ' +
        'FROM  users u                            ' +
        'WHERE u.id = ?                           ' ;

    mysql.query(sql.format(queryString, [config.user.system.id]), function(err, result){

        if (!result.length || err) {
            return null;
        }

        result.forEach(function(index) {

            index.display_name       = getReadbleName(index.first_name, index.last_name);
            index.short_name         = getShortName(index.first_name, index.last_name);
            index.attributes         = {};
        });

        // All is well, return successful user
        userModel.push(result[0]);
    });
}

/**
 * TITLE        : User method
 * DESCRIPTION  : Get by lists users
 *
 */
const getByList = function (done) {

    let queryString = 'SELECT   u.`id`,                                           ' +
        '                       u.`email`,                                        ' +
        '                       u.`first_name`,                                   ' +
        '                       u.`last_name`,                                    ' +
        '                       u.`company`,                                      ' +
        '                       r.`id` AS `room`,                                 ' +
        '                       u.`roles`,                                        ' +
        '                       m.`unread`                                        ' +
        'FROM  users u                                                            ' +
        'LEFT  JOIN `rooms` r ON u.`id` = r.`id_user`                             ' +
        'LEFT  JOIN (SELECT count(*) as unread, from_id                           ' +
        '               FROM messages WHERE is_read = 0                           ' +
        '               GROUP BY from_id) AS m                                    ' +
        'ON m.`from_id` = u.`id`                                                  ' +
        'WHERE u.`roles` = ?                                                      ' +
        'GROUP BY u.id                                                            ' ;

    mysql.query(sql.format(queryString, ['GUEST']), function(err, result){
        if (err)
            return done(err);
        if (!result.length) {
            return done(null, false);
        }

        result.forEach(function(index, elem) {

            index.display_name       = getReadbleName(index.first_name, index.last_name);
            index.short_name         = getShortName(index.first_name, index.last_name);

            index.attributes         = {};
            index.attributes.online  = false;
            index.attributes.current = false;
            index.attributes.unread  = index.unread;

            delete(index.unread);
        });

        // All is well, return successful user
        return done(null, result);
    });
}


/**
 * TITLE        : User method
 * DESCRIPTION  : Get information on conversation assists
 *
 */
const getAssistant = function (id_room, done) {

    let queryString = 'SELECT   u.`id`,                                           ' +
        '                       u.`email`,                                        ' +
        '                       u.`first_name`,                                   ' +
        '                       u.`last_name`,                                    ' +
        '                       u.`roles`                                         ' +
        'FROM messages m                                                          ' +
        'INNER  JOIN users u ON u.id = m.from_id                                  ' +
        'WHERE  m.room_id = ?                                                     ' +
        'AND    u.roles = ?                                                       ' +
        'GROUP  BY m.`from_id`                                                    ' ;

    mysql.query(sql.format(queryString, [id_room, 'BOOKER']), function(err, result){
        if(err)
            return done(err, null);
        if(!result)
            return done(null, null);

        for(let i = 0; i < result.length; i++) {
            result[i].display_name  = getReadbleName(result[i].first_name, result[i].last_name);
            result[i].short_name    = getShortName(result[i].first_name, result[i].last_name);

            delete(result[i].password)
        }
        return done(null, result);
    });
}

/**
 * TITLE        : User method
 * DESCRIPTION  : Get information on conversation assists
 *
 */
const getInfoProfile = function (id_room, done) {

    let queryString = 'SELECT u.* FROM users u    ' +
        'INNER  JOIN rooms r ON u.id = r.id_user  ' +
        'WHERE  r.id = ?                          ' ;

    mysql.query(sql.format(queryString, [id_room]), function(err, result){
        if(err)
            return done(err, null);
        if(!result)
            return done(null, null);

        for(let i = 0; i < result.length; i++) {
            result[i].display_name  = getReadbleName(result[i].first_name, result[i].last_name);
            result[i].short_name    = getShortName(result[i].first_name, result[i].last_name);

            delete result[i].password;
        }
        return done(null, result);
    });
}

/**
 * TITLE        : User method
 * DESCRIPTION  : Receive`s information on the number of investments in the dialog
 *
 */
const getCntUpload = function (id_room, done) {

    let queryString = 'SELECT count(*) sum, m.type FROM messages m  ' +
        'INNER  JOIN uploads u ON m.id = u.id_message               ' +
        'WHERE  m.room_id = ?                                       ' +
        'GROUP  by m.type                                           ' ;

    mysql.query(sql.format(queryString, [id_room]), function(err, result){
        if(err)
            return done(err, null);
        if(!result)
            return done(null, null);

        let array = {};

        for(let i = 0; i < result.length; i++) {
            array[result[i].type] = result[i].sum;
        }

        return done(null, array);
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

/**
 * TITLE        : User method
 * DESCRIPTION  :
 *
 */
const getReadbleName = function (firstName, lastName) {
    return firstName+ ' ' + lastName;
}

/**
 * TITLE        : User method
 * DESCRIPTION  :
 *
 */
const getShortName = function (firstName, lastName) {
    return firstName.substr(0, 1).toUpperCase() + lastName.substr(0, 1).toUpperCase();
}

/**
 * TITLE        : User method
 * DESCRIPTION  : Add system user in collection
 *
 */
addSystem();

/**
 * TITLE        : User method
 * DESCRIPTION  : Get user system
 *
 */
const getSystem = function () {
    return userModel.find(u => u.id === config.user.system.id)
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
    getAssistant,
    getInfoProfile,
    getReadbleName,
    getShortName,
    getSystem
};