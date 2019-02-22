let initializeConnection = (that) => {
    // Listen to the update event of users in the room
    that.$socket.on('users:update', users => {
        that.users = [...users]
    })
    // Listen to the user status update event.
    that.$socket.on('users:status', user => {
        for(let j = 0; j < that.usersList.length; j++) {
            if(that.usersList[j].id === user.id) {
                if(that.usersList[j].attributes.online === true){
                    that.usersList[j].attributes.online = false;
                } else {
                    that.usersList[j].attributes.online = true;
                }
            }
        }
    })
    // Listen to the event of receiving a list of online users
    that.$socket.on('users:get', user => {
        for(let i = 0; i < user.length; i++){
            let j = that.usersList.findIndex(u => u.id === user[i].id)
            if(j !== undefined){
                that.usersList[j].attributes.online = true;
            }
        }
    })
    that.$socket.on('message:new', message => {
        // Listen to the message receiving event
        let inMessage       = message,
            that_clone      = that,
            outMessages     = that_clone.messages,
            lastOutMessages = outMessages.length - 1;
        if(message.user.roles === 'BOOKER') {
            let assistant = that.profile.assistants.find(u => u.id === message.user.id);
            if(!assistant) {
                let newAssistant = {};
                newAssistant.id             = message.user.id;
                newAssistant.email          = message.user.email;
                newAssistant.first_name     = message.user.first_name ;
                newAssistant.last_name      = message.user.last_name;
                newAssistant.roles          = message.user.roles;
                newAssistant.display_name   = message.user.display_name;
                newAssistant.short_name     = message.user.short_name;
                that.profile.assistants.push(newAssistant);
                //  that.getProfileAssistant(that.user.room, that.user.id);
            }
        }
        if(outMessages.length && outMessages[lastOutMessages].collection[outMessages[lastOutMessages].collection.length - 1].from_id === inMessage.collection[0].from_id &&
            outMessages[outMessages.length - 1].collection[outMessages[outMessages.length - 1].collection.length - 1].stack_id !== inMessage.collection[0].stack_id) {
            outMessages[outMessages.length - 1].collection.push(inMessage.collection[0]);
        }
        else if(outMessages.length && outMessages[outMessages.length - 1].collection[outMessages[outMessages.length - 1].collection.length - 1].stack_id === inMessage.collection[0].stack_id) {
            if(inMessage.collection[0].upload.length) {
                outMessages[outMessages.length - 1].collection[outMessages[outMessages.length - 1].collection.length - 1].upload.push(inMessage.collection[0].upload[0])
            }
            if(inMessage.collection[0].body) {
                outMessages[outMessages.length - 1].collection[outMessages[outMessages.length - 1].collection.length - 1].body = inMessage.collection[0].body;
            }
        }
        else {
            outMessages.push(inMessage);
        }
        if (inMessage.user.id !== that.user.id) {
            for (let i = 0; i < that.usersList.length; i++) {
                if (that.usersList[i].id === inMessage.user.id && that.usersList[i].attributes.current) {
                    socket.emit('message:read', inMessage);
                }
            }
        }
        that.loading.messageBox = 1;
        that.scrollToBottom(that.$refs.messages)
    })
    that.$socket.on('hiddenMessage:new', message => {
        that.usersList.forEach(function(elem) {
            if (elem.id === message.user.id && !elem.attributes.current) {
                elem.attributes.unread = elem.attributes.unread + 1;
            }
        })
    });
    that.$socket.on('message:read', message => {
        for (let i = that.messages.length - 1; i >= 0; i--) {
            for (let j = 0; j < that.messages[i].collection.length; j++) {
                if (!that.messages[i].collection[j].is_read && (that.messages[i].user.id === message.user.id)) {
                    that.messages[i].collection[j].is_read = 1;
                }
            }
        }
    });
    that.$socket.on('message:read_all', user => {
        for (let i = that.messages.length - 1; i >= 0; i--) {
            for (let j = that.messages[i].collection.length - 1; j >= 0; j--) {
                if (!that.messages[i].collection[j].is_read && (that.messages[i].user.id !== user.id)) {
                    that.messages[i].collection[j].is_read = 1;
                } else {
                    break;
                }
            }
        }
    });
}

let initializeSocket = (that) => {
    // Get the list online
    that.$socket.emit('users:get');
    // Initialize Socket Taps
    that.initializeConnection(that);
}

export default {
    initializeConnection,
    initializeSocket
}