'use strict';

var users       = require('../models/users')
var messages    = require('../models/messages')

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
            let user = users.get(socket.id);
            if(user){

                // Write a new message to the database
                messages.save(user.id, user.room, data.type, data.text, null, function(err, result) {
                    let collectionData                      = {};
                        collectionData.message              = {};
                        collectionData.message.body         = data.text;
                        collectionData.message.type         = data.type;
                        collectionData.user                 = user;
                    if (err) {
                        collectionData.success = false;

                        // Send message back to user
                        socket.emit('message:new', collectionData);
                    }

                    if(result) {
                        collectionData.success    = true;
                        collectionData.message.id = result;

                        // Send the message to all users who are attached to sockets
                        io.to(user.room).emit('message:new', collectionData);
                        socket.broadcast.emit('hiddenMessage:new', collectionData);
                    }
                });

                //
                if(data.attachments) {
                    for(let i = 0; i < data.attachments.length; i++) {

                        let type = data.attachments[i].type.match(/image.*/)
                            ? 'image'
                            : 'document';

                        messages.save(user.id, user.room, type, 'NULL', data.attachments[i].id, function(err, result) {
                            let collectionFile                  = {};
                            collectionFile.message              = {};
                            collectionFile.message.body         = null;
                            collectionFile.message.type         = type;
                            collectionFile.message.upload       = data.attachments[i];
                            collectionFile.user                 = user;
                            if (err) {
                                collectionFile.success = false;

                                // Send message back to user
                                socket.emit('message:new', collectionFile)
                            }

                            if(result) {
                                collectionFile.success    = true;
                                collectionFile.message.id = result;

                                // Send the message to all users who are attached to sockets
                                io.to(user.room).emit('message:new', collectionFile)
                            }
                        })
                    }
                }
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
                io.to(user.room).emit('users:update', users.getByRoom(user.room));

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

	let server 	= require('http').Server(app);
	let io 		= require('socket.io')(server);

	// Define all Events
	ioEvents(io);

	// The server object will be then used to list to a port number
	return server;
}

module.exports = init;

