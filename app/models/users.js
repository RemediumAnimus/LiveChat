'use strict';

/**
 * DESCRIPTION  : Declares variables
 *
 */
const mysql      = require('../database');
const config     = require('../config');
const sql        = require('sqlstring');
const crypto     = require('crypto');
const curl       = require('request-promise');

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
 * DESCRIPTION  : Add user to database
 *
 */
const insertUser = function (email, password, firstname, lastname, company, roles, done) {
    password = crypto.createHmac('sha256', String(password)).digest('hex');
    let queryString = 'INSERT INTO users (  email,      ' +
        '                                   password,   ' +
        '                                   first_name, ' +
        '                                   last_name,  ' +
        '                                   company,    ' +
        '                                   roles)      ' +
        'VALUES (?, ?, ?, ?, ?, ?)                      ' ;

    mysql.query(sql.format(queryString, [email, password, firstname, lastname, company, roles]), function(err, result){

        if(err) {
            return done(err, null);
        }
        if (!result) {
            return done(true, null);
        }

        queryString = 'INSERT INTO rooms (id_user)    ' +
            'VALUES (?)                               ' ;

        mysql.query(sql.format(queryString, [result.insertId]), function(err, result){

            if(err) {
                return done(err, null);
            }
            if (!result) {
                return done(true, null);
            }

            return done(null, result.insertId);
        });
    });
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

/**
 * TITLE        : User method
 * DESCRIPTION  : cURL id2
 *
 */
const searchAction = function (sig, request, done) {

    let options = {
        method: 'POST',
        uri: 'https://id2.action-media.ru/api/rest/mobile',
        body: request,
        headers: {
            'content-type': 'application/x-www-form-urlencoded'
        }
    };

    curl(options)
        .then(function (body) {
            if(JSON.parse(body).Error.Code === 0)
                return done(false, JSON.parse(body).Data)

            return done('no token', null);
        })
        .catch(function (err) {
            return done(err, null);
        });
}


module.exports = {
    add,
    insertUser,
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
    getSystem,
    searchAction
};