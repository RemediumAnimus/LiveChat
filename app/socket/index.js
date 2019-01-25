'use strict';

var users   = require('../models/users')
var message = (name, text, id, roles) => ({name, text, id, roles})

/**
 * Encapsulates all code for emitting and listening to socket events
 *
 */
var ioEvents = function(io) {

    // Hear the events on the users connection
    io.on('connection', socket => {

        // We will listen in on the connection of users to a specific chat.
        socket.on('join', (user, callback) => {

            if (!user.name || !user.room) {
                return callback('Enter valid user data')
            }

            // Call the callback function
            callback({userId: socket.id})

            // We attach the socket
            socket.join(user.room)

            // Clearing user data
            users.remove(socket.id)

            // Add user data
            users.add(socket.id, user.id, user.name, user.room, user.roles)

            // We update the list of users in the dialog
            io.to(user.room).emit('users:update', users.getByRoom(user.room))

            // Sends request to add online user
            socket.broadcast.emit('users:status', users.get(socket.id));
        })

        // Hearing events to receive messages
        socket.on('message:create', (data, callback) => {

            if (!data) {
                return callback(`Message can't be empty`)
            }

            // Get user data
            var user = users.get(socket.id)

            if(user){

                // Form response data
                var collectionData = {
                    'attributes': {
                        'body': data.text
                    },
                    'user': user
                }

                // We send the message to all users who are attached to sockets
                io.to(user.attributes.room).emit('message:new', collectionData)
            }

            // Call the callback function
            callback()
        })

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
                io.to(user.attributes.room).emit('users:update', users.getByRoom(user.attributes.room));

                // Sends request to add online user
                socket.broadcast.emit('users:status', userCollection);
            }
        })
    })
}

/**
 * Initialize Socket.io
 *
 */
var init = function(app){

	var server 	= require('http').Server(app);
	var io 		= require('socket.io')(server);

	// Define all Events
	ioEvents(io);

	// The server object will be then used to list to a port number
	return server;
}

module.exports = init;