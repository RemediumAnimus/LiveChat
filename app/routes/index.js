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
const md5        = require('md5');

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
        res.render(config.chat.template.login.client);
    }
});

/**
 * TITLE        : Home page
 * DESCRIPTION  : Redirects to the chat page if the user is logged in
 *
 */
router.get('/operator', function(req, res, next) {

    // If user is already logged in, then redirect to chat page
    if(req.isAuthenticated()){
        res.redirect('/chat');
    }
    else {
        res.render(config.chat.template.login.operator);
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
        default: template = config.chat.template.client;
    }

    // Generates a pattern
    res.render(template);
}]);

/**
 * TITLE        : Chat router
 * DESCRIPTION  : Login for operator
 *
 */
router.post('/auth', function(req, res, next) {

    passport.authenticate('local-login', function (err, user) {

        if (err) {
            return res.status(200).json({status: false, error: err});
        }
        if (!user) {
            return res.status(200).json({status: false, error: 'User is not found...'});
        }
        if(user.roles !== config.chat.roles.operator) {
            return res.status(200).json({status: false, error: 'User is not found...'});
        }
        req.logIn(user, function(err) {
            if (err) {
                return res.status(200).json({status: false, error: 'Could not log in user...'});
            }
            res.status(200).json({status: true, error: false});
        });
    })(req, res, next);
});

/**
 * TITLE        : Login user
 * DESCRIPTION  : Redirects to the chat page if the user is logged in
 *
 */
router.post('/login', function(req, res, next) {

    let appid       = encodeURIComponent('10729'),
        format      = encodeURIComponent("json"),
        deviceid    = encodeURIComponent("12356789n"),
        useragent   = encodeURIComponent("androidphone."),
        rand        = encodeURIComponent(new Date()),
        secret      = encodeURIComponent("qA7redrL5L"),
        method 	    = encodeURIComponent('login'),
        password 	= encodeURIComponent(req.body.password),
        login  	    = req.body.username.toLowerCase();

        let sig     = md5("appid"+appid.toLowerCase()+'deviceid'+deviceid.toLowerCase()+'format'+format.toLowerCase()+'login'+login.toLowerCase()+'method'+method.toLowerCase()+'pass'+password.toLowerCase()+appid+secret),
        request     = "appid="+appid+"&deviceid="+deviceid+"&format="+format+"&login="+login+"&method="+method+"&pass="+password+"&rand="+rand+"&useragent="+useragent+'com.ut.android.action1.0'+"&sig="+sig+"";

        User.searchAction(sig, request, function(err, data) {

            if(err) {
                return res.status(200).json({status: false, error: 'Authorization error...'});
            }
            if(!data.Token) {
                return res.status(200).json({status: false, error: 'Сlient not found...'});
            }

            sig     = md5("appid"+appid+'fieldsemail,birthdate,city,branch,createdate,fillprofile,firstname,middlename,lastname,gender,id,lastmodify,login,phone,phonesubmitted,post,region,regionguid,staff,tzid,urlreferrer,xssidentifierformat'+format+'methodgetprofile2token'+data.Token+appid+secret);
            request = "appid="+appid+"&format="+format+"&fields=Email,Birthdate,City,Branch,Createdate,Fillprofile,Firstname,Middlename,Lastname,Gender,Id,Lastmodify,Login,Phone,Phonesubmitted,Post,Region,Regionguid,Staff,Tzid,UrlReferrer,Xssidentifier&method=getprofile2&token="+data.Token+"&sig="+sig+"";

            User.searchAction(sig, request, function(err, result) {

                if(!result.Fields){
                    return res.status(200).json({status: false, error: 'No data was found for the specified client...'});
                }

                let object = {};
                    object.email     = result.Fields.Email;
                    object.firstname = result.Fields.Firstname;
                    object.lastname  = result.Fields.Lastname;
                    object.roles     = config.chat.roles.client;
                    object.token     = data.Token;

                passport.authenticate('local-login', function (err, user) {

                    if (err) {
                        return res.status(200).json({status: false, error: err});
                    }
                    if (!user) {

                        User.insertUser(object.email, req.body.password, object.firstname, object.lastname, null, object.roles, function(err, out) {

                            if(err) {
                                return res.status(200).json({status: false, error: err});
                            }
                            if(!out) {
                                return res.status(200).json({status: false, error: 'Error creating new user...'});
                            }

                            passport.authenticate('local-login', function (err, newuser) {
                                if (err) {
                                    return res.status(200).json({status: false, error: err});
                                }
                                if (!newuser) {
                                    return res.status(200).json({status: false, error: 'Authorization error by new user...'});
                                }
                                if(newuser.roles !== config.chat.roles.client) {
                                    return res.status(200).json({status: false, error: 'User is not found...'});
                                }
                                req.logIn(newuser, function(err) {
                                    if (err) {
                                        return res.status(500).json({status: false, error: 'Could not log in user...'});
                                    }
                                    res.status(200).json({status: true, error: false});
                                });
                            })(req, res, next);
                        })
                    } else {
                        if(user.roles !== config.chat.roles.client) {
                            return res.status(200).json({status: false, error: 'User is not found...'});
                        }
                        req.logIn(user, function(err) {
                            if (err) {
                                return res.status(500).json({status: false, error: 'Could not log in user...'});
                            }
                            res.status(200).json({status: true, error: false});
                        });
                    }
                })(req, res, next);
            })
        })
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
    let objectPlanner   = req.body.planner
                        ? req.body.planner
                        : false;
    let objectOrigName  = objectFile.name;
    let objectType      = objectFile.mimetype;
    let objectExt       = path.extname(objectOrigName);
    let objectName      = crypto.randomBytes(20).toString('hex');
    let objectSize      = 0;

    let objectPassword  = !objectPlanner
                        ? crypto.createHmac('sha256', String(objectUser.id+'_'+objectRoom)).digest('hex')
                        : crypto.createHmac('sha256', String(objectUser.id+'_'+objectRoom+'_'+objectPlanner)).digest('hex');

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

        if(!result.length) {
            return res.status(200).json({status: false, result: [], attachments: []});
        }

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
router.post("/task/download", (req, res) => {

    if (Object.keys(req.user).length === 0) {
        return res.status(403).json({status: false, err: 'Access denied!'});
    }

    let objectUser      = req.user.id,
        objectType      = req.query.type,
        objectOffset    = req.body.offset,
        objectRoom      = req.user.room_id;

    Planners.download(objectUser, objectRoom, objectType, objectOffset, function(err, result) {
        if(err) {
            return res.status(500).json({status: false});
        }
        if (result) {
            return res.status(200).json({status: true, result: result});
        }
        else {
            return res.status(200).json({status: false});
        }
    })

});

/**
 * TITLE        : Planner router
 * DESCRIPTION  : Get list for planner start loading
 *
 */
router.post("/task/list", (req, res) => {

    if (Object.keys(req.user).length === 0) {
        return res.status(403).json({status: false, err: 'Access denied!'});
    }

    let objectUser      = req.user.id,
        objectRoom      = req.user.room_id,
        objectType      = [0, 1];

    Planners.list(objectUser, objectRoom, objectType, function(err, result) {
        if(err) {
            return res.status(500).json({status: false});
        }
        if (result) {
            return res.status(200).json({status: true, result: result});
        }
        else {
            return res.status(200).json({status: false});
        }
    })

});

/**
 * TITLE        : Planner router
 * DESCRIPTION  : Get list for planner start loading
 *
 */
router.post("/task/comment", (req, res) => {

    if (Object.keys(req.user).length === 0) {
        return res.status(403).json({status: false, err: 'Access denied!'});
    }

    let objectItem   = req.body.id,
        objectRoom   = req.user.room,
        objectOffset = req.body.offset;

    Planners.getComment(objectItem, objectRoom, objectOffset, function(err, result) {
        if(err) {
            return res.status(500).json({status: false});
        }
        if (result) {
            return res.status(200).json({status: true, result: result});
        }
        else {
            return res.status(200).json({status: false});
        }
    })

});
/**
 * TITLE        : Planner router
 * DESCRIPTION  : Get list uploads for planner
 *
 */
router.post("/task/attachments", (req, res) => {

    if (Object.keys(req.user).length === 0) {
        return res.status(403).json({status: false, err: 'Access denied!'});
    }

    let objectRoom      = req.body.room;
    let objectItem      = req.body.id;
    let objectUser      = req.user.id;
    let objectPassword  = crypto.createHmac('sha256', String(objectUser+'_'+objectRoom+'_'+objectItem)).digest('hex');

    Uploads.get(objectPassword, objectRoom, function(err, out) {
        if (out) {
            return res.status(200).json({status: true, attachments: out});
        }
        else {
            return res.status(200).json({status: false, attachments: []});
        }
    })

});


module.exports = router;