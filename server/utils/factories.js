const uuidv4 = require('uuid').v4;

const createUser = ({ name = "", socketId = null } = {}) => ({
    id: uuidv4(),
    name,
    socketId
});

const createMessage = ({ message = "", sender = "", type = "text" } = {}) => ({
    id: uuidv4(),
    time: getTime(new Date(Date.now())),
    message,
    sender,
    type
});

const createChat = ({ messages = [createMessage({ message: 'Chat Started' })], name = "Community", users = [] } = {}) => ({
    id: uuidv4(),
    name,
    messages,
    users,
    typingUsers: [],
    unread: 0
});

const getTime = (date) => `${ date.getHours() }:${ ("0" + date.getMinutes()).slice(-2) }`;

module.exports = {
    createUser,
    createMessage,
    createChat
};