'use strict';

/**
 * DESCRIPTION  : Declares variables
 *
 */
const express	 = require('express');
const passport   = require('passport');
const path       = require('path')
const crypto     = require('crypto');
const fs         = require('fs');
const router 	 = express.Router();

const User       = require('../models/users');
const Uploads    = require('../models/uploads');
const Images     = require('../models/images');
const Messages   = require('../models/messages');
const config     = require('../config');


/**
 * TITLE        : Home page
 * DESCRIPTION  : Redirects to the chat page if the user is logged in
 *
 */
router.get('/', function(req, res, next) {

    // If user is already logged in, then redirect to chat page
    if(req.isAuthenticated()){
        res.redirect('/chat');
    }
    else {
        res.render('login');
    }
});

/**
 * TITLE        : Chat router
 * DESCRIPTION  : Sends data to an authorized user in the system
 *
 */
router.get('/chat', [User.isAuthenticated, function(req, res) {

    // Announces a template
    let template = '';

    // Checks user role
    switch(req.user.roles) {
        case config.chat.roles.operator:
            template = config.chat.template.operator;
            break;
        case config.chat.roles.client:
            template = config.chat.template.client;
            break;
    }

    // Generates a pattern
    res.render(template);
}]);

/**
 * TITLE        : Login user
 * DESCRIPTION  : Redirects to the chat page if the user is logged in
 *
 */
router.post('/login', function(req, res, next) {
    passport.authenticate('local-login', function (err, user, info) {
        if (err) {
            return res.status(401).json(err);
        }
        if (user) {
            req.logIn(user, function(err) {
                 if (err) {
                    return res.status(500).json({
                        err: 'Could not log in user!'
                    });
                }
                res.status(200).json({
                    status: 'Login successful!'
                });
            });
        } else {
            res.status(401).json(info);
        }
    })(req, res, next);
})

/**
 * TITLE        : Client router
 * DESCRIPTION  : Gets a list of users in the operators application
 *
 */
router.post('/users/list', function(req, res) {

    // Checks access to server chat
    User.isOperator(req, function(err) {
        if (err) {
            return res.status(403).json(err);
        }
    })

    // Gets a list of customers
    User.getByList(function(err, rows){
        if (err) {
            return res.status(401).json(err);
        }
        if(rows) {
            res.status(200).json(rows);
        }
    })
})

/**
 * TITLE        : Users router
 * DESCRIPTION  : Update the user list of read messages by operator
 *
 * Update the user list of read messages from operator/user.
 */
router.post('/users/update', function(req, res) {

    let collection = {
        'id_user'              : req.body.id_user,
        'id_room'              : req.body.id_room,
        'update_from_client'   : req.body.update_from_client,
        'update_from_operator' : req.body.update_from_operator
    }

    User.updateUserMessage(collection, function(err, rows){
        if(rows) {
            res.status(200).json(rows);
        }
    })
})

/**
 * TITLE        : Users router
 * DESCRIPTION  : Obtains information from an authorized user
 *
 */
router.post('/users/get', function(req, res) {
    if(req.user) {
        if(req.user.room === null){
            delete(req.user.room);
        }
        return res.status(200).json(req.user);
    }
    else {
        return res.status(401).json('Data not received');
    }
})

/**
 * TITLE        : Uploads router
 * DESCRIPTION  : Gets information about unfinished downloads
 *
 */
router.post('/uploads/attachments', function(req, res) {

    if (Object.keys(req.user).length == 0) {
        return res.status(400).json({status: false, err: 'No authorized.'});
    }

    let objectUser      = req.user;
    let objectRoom      = req.body.room_id;

    let objectPassword  = crypto.createHmac('sha256', String(objectUser.id+'_'+objectRoom)).digest('hex');

    Uploads.get(objectPassword, function(err, result) {
        if (err)
            return res.status(500).send(err);
        if (result) {
            return res.status(200).json({status: true, attachments: result});
        } else {
            return res.status(500).send(err);
        }
    })
})

/**
 * TITLE        : Uploads router
 * DESCRIPTION  : Cuts and uploads files to server
 *
 */
router.post('/upload/loading', function(req, res) {

    if (Object.keys(req.files).length == 0) {
        return res.status(400).json({status: false, err: 'No files were uploaded.'});
    }

    if (Object.keys(req.user).length == 0) {
        return res.status(400).json({status: false, err: 'No authorized.'});
    }

    // Get files
    let objectFile      = req.files.file;
    let objectUser      = req.user;
    let objectRoom      = req.body.room;

    let objectOrigName  = objectFile.name;
    let objectType      = objectFile.mimetype;
    let objectExt       = path.extname(objectOrigName);
    let objectName      = crypto.randomBytes(20).toString('hex');
    let objectPassword  = crypto.createHmac('sha256', String(objectUser.id+'_'+objectRoom)).digest('hex');


    if (!fs.existsSync('upload/'+objectRoom)){
        fs.mkdirSync('upload/'+objectRoom);
    }

    let objectUploadPath = 'upload/'+objectRoom+'/'+objectName+objectExt+'';
    let objectResize     = objectType.match(/image.*/)
        ? true
        : false;

    // Use the mv() method to place the file somewhere on your server
    objectFile.mv(objectUploadPath, function(err) {
        if (err)
            return res.status(500).send(err);

        Uploads.save(objectOrigName, objectName, objectPassword, objectType, objectExt, function(err, result) {
            if (err)
                return res.status(500).send(err);
            if (result) {

                if(objectResize) {
                    Images.resizeXS(objectUploadPath, objectRoom, objectName, objectExt, function(err, result) {
                        /*console.log(result)*/
                    });
                    Images.resizeSM(objectUploadPath, objectRoom, objectName, objectExt, function(err, result) {
                        /*console.log(result)*/
                    });
                }
                return res.status(200).json({status: true, attachment: { id             : result,
                                                                         original_name  : objectOrigName,
                                                                         name           : objectName,
                                                                         type           : objectType,
                                                                         ext            : objectExt }
                });
            } else {
                return res.status(500).send(err);
            }
        })
    });
});

/**
 * TITLE        : Uploads router
 * DESCRIPTION  : Receive`s the requested file
 *
 */
router.get("/upload/:room/:name", (req, res) => {

    if (Object.keys(req.user).length == 0) {
        return res.status(403).json({status: false, err: 'Access denied!'});
    }

    var options = {
        root: __dirname + '/../../upload/',
        headers: {
            'x-timestamp': Date.now(),
            'x-sent': true
        }
    };

    res.sendFile(req.params.room+'/'+req.params.name, options);
});

/**
 * TITLE        : Messages router
 * DESCRIPTION  : Get`s messages for room
 *
 */
router.post('/messages/all', [User.isAuthenticated, function(req, res) {

    if (Object.keys(req.body).length == 0) {
        return res.status(400).json({status: false, err: 'Body response empty!'});
    }

    // Get the data
    let room_id = req.body.room_id;
    let offset  = req.body.offset ? req.body.offset : 0;

    Messages.get(room_id, offset, function(err, result) {
        if (err)
            return res.status(500).send(err);
        if (result) {
            return res.status(200).json({status: true, result: result});
        } else {
            return res.status(200).send({status: false, result: []});
        }
    })
}])

router.post('/messages/update_read', [User.isAuthenticated, function(req, res) {

    if (Object.keys(req.body).length == 0) {
        return res.status(400).json({status: false, err: 'Body response empty!'});
    }

    let ids_message = '';
    for (let i=0; i<req.body.collection.length; i++) {
        ids_message += req.body.collection[i].id + ',';
    }

    Messages.update_read(ids_message,function(err, result) {
        if (err)
            return res.status(500).send(err);
        if (result) {
            return res.status(200).json({status: true, messages: result});
        } else {
            return res.status(200).send({status: false, messages: []});
        }
    });
}])

router.get('/template', function(req, res) {


    // Generates a pattern
    res.render('operator');
});


module.exports = router;