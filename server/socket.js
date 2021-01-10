const io = require('./index').io;
const { FILE_SENT, PRIVATE_MESSAGE, VERIFY_USER, USER_CONNECTED, USER_DISCONNECTED, COMMUNITY_CHAT, MESSAGE_RECEIVED, MESSAGE_SENT, TYPING } = require('./utils/events');
const { createUser, createChat, createMessage } = require('./utils/factories');

let connectedUsers = {},
	communityChat = createChat();

module.exports = socket => {
	let sendMessageToChatFromUser,
		sendTypingFromUser;

	socket.on(VERIFY_USER, (nickname, cb) => {
		if (nicknameExists(connectedUsers, nickname)) cb({ exists: true, user: null });
		else cb({ exists: false, user: createUser({ name: nickname, socketId: socket.id }) });
	});

	socket.on(USER_CONNECTED, user => {
		user.socketId = socket.id;
		connectedUsers = addUser(connectedUsers, user);
		socket.user = user;
		sendMessageToChatFromUser = sendMessageToChat(user.name);
		sendTypingFromUser = sendTypingToChat(user.name);
		io.emit(USER_CONNECTED, connectedUsers);

		//
		const msg = `${ user.name } Joined`;
		communityChat.messages.push(createMessage({ message: msg, sender: '' }));
		io.emit(`${ MESSAGE_RECEIVED }-${ communityChat.id }`, createMessage({ message: msg, sender: '' }));
		//

		console.log(user.name, 'Connected');
		console.log('Connected Users:', Array.from(Object.keys(connectedUsers)).join(', '));
	});

	socket.on('disconnect', () => {
		if ("user" in socket) {
			connectedUsers = removeUser(connectedUsers, socket.user.name);
			io.emit(USER_DISCONNECTED, connectedUsers, socket.user.name);

			//
			const msg = `${ socket.user.name } Left`;
			communityChat.messages.push(createMessage({ message: msg, sender: '' }));
			io.emit(`${ MESSAGE_RECEIVED }-${ communityChat.id }`, createMessage({ message: msg, sender: '' }));
			io.emit(`${ TYPING }-${ communityChat.id }`, { user: socket.user.name, isTyping: false });
			//

			console.log(socket.user.name, 'Disconnected');
		}
	});

	socket.on(COMMUNITY_CHAT, (cb) => {
		cb(communityChat);
	});

	socket.on(MESSAGE_SENT, ({ chatId, message }) => {
		socket.user && sendMessageToChatFromUser(chatId, message);
	});

	socket.on(FILE_SENT, ({ chatId, file }) => {
		socket.user && sendMessageToChatFromUser(chatId, file, 'image');
	});

	socket.on(TYPING, ({ chatId, isTyping }) => {
		socket.user && sendTypingFromUser(chatId, isTyping);
	});

	socket.on(PRIVATE_MESSAGE, ({ receiver, sender }) => {
		if (receiver in connectedUsers) {
			const chat = createChat({ name: `${ receiver } & ${ sender }`, users: [receiver, sender] });
			const senderChat = { ...chat };
			const receiverChat = { ...chat };
			senderChat.name = receiver;
			receiverChat.name = sender;

			const receiverSocket = connectedUsers[receiver].socketId;
			socket.to(receiverSocket).emit(PRIVATE_MESSAGE, receiverChat, sender);
			socket.emit(PRIVATE_MESSAGE, senderChat, sender);
		}
	});
};

function sendTypingToChat(user) {
	return (chatId, isTyping) => io.emit(`${ TYPING }-${ chatId }`, { user, isTyping });
}

function sendMessageToChat(sender) {
	return (chatId, message, type) => {

		const _message = createMessage({ message, sender, type: type ? type : 'text' });
		//
		if (chatId === communityChat.id) communityChat.messages.push(_message);
		//

		io.emit(`${ MESSAGE_RECEIVED }-${ chatId }`, _message);
	};
}

function addUser(connectedUsers, nickname) {
	const tempUsers = Object.assign({}, connectedUsers);
	tempUsers[nickname.name] = nickname;
	return tempUsers;
}

function removeUser(connectedUsers, nickname) {
	const tempUsers = Object.assign({}, connectedUsers);
	delete tempUsers[nickname];
	return tempUsers;
}

function nicknameExists(connectedUsers, nickname) { return nickname in connectedUsers; }