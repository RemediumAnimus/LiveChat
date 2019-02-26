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
const Planners   = require('../models/planners');
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

    Messages.updateReadAll(collection);
})

/**
 * TITLE        : Users router
 * DESCRIPTION  : Get info user for profile block
 *
 */
router.post('/users/profile', function(req, res) {

    let object       = {};
        object.user  = req.body.id_user,
        object.room  = req.body.id_room;

    let objectUser          = {},
        objectOperators     = [];

    User.getInfoProfile(object.room, function(err, rows) {
        if (rows) {
            objectUser = rows[0];
        }

        User.getAssistant(object.room, function(err, result) {
            if (result) {
                objectOperators = result;
            }

            returnOut(objectUser, objectOperators);
        })
    });

    const returnOut = function(objectUser, objectOperators) {
        return res.status(200).json({
            status      : true,
            assistants  : objectOperators,
            user        : objectUser
        });
    }
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

        req.user.display_name = User.getReadbleName(req.user.first_name, req.user.last_name);
        req.user.short_name   = User.getShortName(req.user.first_name, req.user.last_name);

        return res.status(200).json(req.user);
    }
    else {
        return res.status(401).json('Data not received');
    }
})

/**
 * TITLE        : Uploads router
 * DESCRIPTION  : Cuts and uploads files to server
 *
 */
router.post('/upload/loading', function(req, res) {

    if (Object.keys(req.files).length === 0) {
        return res.status(400).json({status: false, err: 'No files were uploaded.'});
    }

    if (Object.keys(req.user).length === 0) {
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
    let objectSize      = 0;
    let objectPassword  = crypto.createHmac('sha256', String(objectUser.id+'_'+objectRoom)).digest('hex');

    let objectNameXS    = null;
    let objectNameSM    = null;

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

        // Transform image into different size
        if(objectResize) {
            Images.resizeXS(objectUploadPath, objectRoom, objectName, objectExt, function(err, result) {

                if(result){

                    // Save the new file size XS (196x196)
                    objectNameXS = result;

                    Images.resizeSM(objectUploadPath, objectRoom, objectName, objectExt, function(err, result) {
                        if(result){

                            // Save the new file size XS 600x600)
                            objectNameSM = result;
                        }

                        // Save result to DB
                        uploadFunction(objectOrigName, objectName, objectNameXS, objectNameSM, objectPassword, objectType, objectExt);
                    });
                }
            });
        } else {
            uploadFunction(objectOrigName, objectName, objectNameXS, objectNameSM, objectPassword, objectType, objectExt);
        }
    });

    const uploadFunction = function(objectOrigName, objectName, objectNameXS, objectNameSM, objectPassword, objectType, objectExt) {

        let fileInfo = fs.statSync(objectUploadPath);

        if(fileInfo) {
            objectSize = fileInfo.size;
        }

        Uploads.save(objectOrigName, objectName, objectNameXS, objectNameSM, objectPassword, objectType, objectSize, objectExt, function(err, result) {
            if (err)
                return res.status(500).send(err);
            if (result) {

                return res.status(200).json({status: true, attachment: {
                        id             : result,
                        original_name  : objectOrigName,
                        type           : objectType,
                        thumb          : Messages.getPath(objectRoom, objectName, objectExt),
                        thumb_xs       : objectNameXS
                                       ? Messages.getPath(objectRoom, objectNameXS, objectExt)
                                       : objectNameXS,
                        thumb_sm       : objectNameSM
                                       ? Messages.getPath(objectRoom, objectNameSM, objectExt)
                                       : objectNameSM,
                        size           : objectSize}
                });
            } else {
                return res.status(500).send(err);
            }
        })
    }
});

/**
 * TITLE        : Uploads router
 * DESCRIPTION  : Gets information about unfinished downloads
 *
 */
router.post('/uploads/delete', function(req, res) {

    if (Object.keys(req.user).length === 0) {
        return res.status(400).json({status: false, err: 'No authorized.'});
    }

    Uploads.remove(req.body.id, function(err, result) {
        if (err)
            return res.status(500).send(err);
        if (result) {
            let objectURL        = [];
                objectURL[0]     = Messages.getPathRemove(req.body.room, result[0].name, result[0].ext);

                if(result[0].name_xs)
                    objectURL[1] = Messages.getPathRemove(req.body.room, result[0].name_xs, result[0].ext);

                if(result[0].name_sm)
                    objectURL[2] = Messages.getPathRemove(req.body.room, result[0].name_sm, result[0].ext);

            for(let i = 0; i < objectURL.length; i++) {

                fs.unlink(objectURL[i], function(err) {
                    if(err) console.log(err)
                })
            }

            return res.status(200).json({status: true});
        } else {
            return res.status(500).send(err);
        }
    })
})

/**
 * TITLE        : Uploads router
 * DESCRIPTION  : Gets file for profile user box
 *
 */
router.post('/uploads/get/', function(req, res) {

    if (Object.keys(req.user).length === 0) {
        return res.status(400).json({status: false, err: 'No authorized'});
    }

    if (!req.query.type) {
        return res.status(200).json({status: false, err: 'No file type specified'});
    }

    Uploads.profile(req.body.room, req.query.type, req.body.offset, function(err, result) {
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
 * DESCRIPTION  : Receive`s the requested file
 *
 */
router.get("/upload/:room/:name", (req, res) => {

    if (Object.keys(req.user).length === 0) {
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

    if (Object.keys(req.body).length === 0) {
        return res.status(400).json({status: false, err: 'Body response empty!'});
    }

    // Get the data
    let objectUser      = req.user;
    let objectRoom      = req.body.room_id;
    let objectOffset    = req.body.offset
                        ? req.body.offset
                        : 0;
    let objectPassword  = crypto.createHmac('sha256', String(objectUser.id+'_'+objectRoom)).digest('hex');
    let objectUploads   = req.body.in_upload
                        ? true
                        : false;

    Messages.get(objectRoom, objectOffset, function(err, result) {
        if (err)
            return res.status(500).send(err);
        if (result) {
            if(objectUploads) {
                Uploads.get(objectPassword, objectRoom, function(err, out) {
                    if (out) {
                        return res.status(200).json({status: true, result: result, attachments: out});
                    }
                    else {
                        return res.status(200).json({status: true, result: result, attachments: []});
                    }
                })
            }
            else return res.status(200).json({status: true, result: result, attachments: []});

        } else {
            return res.status(200).send({status: false, result: []});
        }
    })
}])

/**
 * TITLE        : Planner router
 * DESCRIPTION  : Creating a task for the planner
 *
 */
router.post("/task/create", (req, res) => {

    if (Object.keys(req.user).length === 0) {
        return res.status(403).json({status: false, err: 'Access denied!'});
    }

    let objectUser          = req.user,
        objectBody          = req.body,
        objectClient        = objectBody.user,
        objectOperator      = objectUser.id,
        objectHeader        = objectBody.header,
        objectDescription   = objectBody.description,
        objectComment       = objectBody.comment,
        objectDateEnd       = objectBody.datetime,
        objectType          = objectBody.type,
        objectSelected      = JSON.parse(objectBody.selected);

    Planners.save(objectClient, objectOperator, objectHeader, objectDescription, objectComment, objectDateEnd, objectType, objectSelected, function(err, result) {
        if(err) {
            return res.status(500).json({status: false, result: []});
        }
        if (result) {
            return res.status(200).json({status: true, result: result});
        }
        else {
            return res.status(200).json({status: false, result: []});
        }
    })

});

/**
 * TITLE        : Planner router
 * DESCRIPTION  : Get list for planner
 *
 */
router.post("/task/get", (req, res) => {

    if (Object.keys(req.user).length === 0) {
        return res.status(403).json({status: false, err: 'Access denied!'});
    }

    let objectUser      = req.user.id,
        objectType      = req.query.type,
        objectOffset    = req.body.offset,
        objectRoom      = req.user.room_id;

    Planners.getList(objectUser, objectRoom, objectType, objectOffset, function(err, result) {
        if(err) {
            return res.status(500).json({status: false, result: []});
        }
        if (result) {
            return res.status(200).json({status: true, result: result});
        }
        else {
            return res.status(200).json({status: false, result: []});
        }
    })

});

module.exports = router;