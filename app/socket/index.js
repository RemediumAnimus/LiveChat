'use strict';

/**
 * DESCRIPTION  : Declares variables
 *
 */
const users       = require('../models/users');
const messages    = require('../models/messages');
const config      = require('../config');
const fs          = require('fs');

/**
 * TITLE        : Initialize socket
 * DESCRIPTION  : Encapsulates all code for emitting and listening to socket events
 *
 */
const ioEvents = function(io) {

    // Hear the events on the users connection
    io.on('connection', socket => {

        // We will listen in on the connection of users to a specific chat.
        socket.on('join', (user, callback) => {

            if (!user.room) {
                return callback('Enter valid user data')
            }

            // Call the callback function
            callback({userId: socket.id})

            // We attach the socket
            socket.join(user.room);

            // Clearing user data
            users.remove(socket.id);

            // Add user data
            users.add(socket.id, user);

            // We update the list of users in the dialog
            io.to(user.room).emit('users:update', users.getByRoom(user.room));

            // Sends request to add online user
            socket.broadcast.emit('users:status', users.get(socket.id));
        })

        // Hearing events to receive messages
        socket.on('message:create', (data, callback) => {

            if (!data) {
                return callback(`Message can't be empty`)
            }

            // Get user data

            let user  = users.get(socket.id);
            let stack = new Date().getTime()+user.id;

            if(user){

                // Write a new message to the database
                for(let i = 0; i < data.messages.length; i++) {

                    let type = messages.type(data.messages[i].type);

                    // Save the message in the database
                    messages.save(user.id, user.room, type, data.text, data.messages[i].id, stack, function(err, result) {

                        // Create`s a collection of data
                        let collectionData                  = {};
                        collectionData.user                 = user;

                        collectionData.collection           = [{
                            body     : data.messages[i].text,
                            datetime : messages.time(new Date()),
                            from_id  : user.id,
                            is_read  : 0,
                            stack_id : stack,
                            type     : type,
                            upload   : []
                        }];

                        if(type !== config.chat.messages.type.text) {

                            collectionData.collection[0].body       = null;
                            collectionData.collection[0].upload[0]  = data.messages[i];
                        }

                        if (err) {
                            collectionData.success = false;

                            // Send message back to user
                            socket.emit('message:new', collectionData)
                        }

                        if(result) {
                            collectionData.success          = true;
                            collectionData.collection[0].id = result;

                            // Send the message to all users who are attached to sockets
                            io.to(user.room).emit('message:new', collectionData);
                            socket.broadcast.emit('hiddenMessage:new', collectionData);
                        }
                    })
                }
            }

            // Call the callback function
            callback()
        });

        socket.on('message:update', (object, callback) => {

            io.to(object.user.room).emit('message:read_all', object);

            messages.updateReadAll(object.user.id, object.update_from);
        });

        socket.on('message:read', (message, callback) => {

            io.to(message.user.room).emit('message:read', message);
            messages.update_read(message.collection[0].id);
        });

        // Hearing events to get users
        socket.on('users:get', () => {

            // Get user data (roles = GUEST)
            const usersCollection = users.getAllUsers();
            if(usersCollection){

                // We send the message to all users who are attached to sockets
                socket.emit('users:get', usersCollection)
            }
        })

        // Hear the events to disable users
        socket.on('disconnect', () => {

            // Receives user information
            const userCollection = users.get(socket.id);

            // We delete connection with the user
            const user = users.remove(socket.id);

            if(user) {

                // We update the list of users in the dialog
                io.to(user.room).emit('users:update', users.getByRoom(user.room));

                // Sends request to add online user
                socket.broadcast.emit('users:status', userCollection);
            }
        })
    })
}

/**
 * TITLE  : Initialize socket
 *
 */
const init = function(app){

	let server 	= require('http').Server(app);
	let io 		= require('socket.io')(server);

	// Define all Events
	ioEvents(io);

	// The server object will be then used to list to a port number
	return server;
}

module.exports = init;

