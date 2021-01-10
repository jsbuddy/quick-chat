import React, { Component } from 'react';
import Sidebar from './Sidebar';
import {
	PRIVATE_MESSAGE,
	USER_CONNECTED,
	USER_DISCONNECTED,
	COMMUNITY_CHAT,
	MESSAGE_RECEIVED,
	MESSAGE_SENT,
	TYPING, FILE_SENT
} from '../../server/utils/events';

class Chat extends Component {

	constructor() {
		super();

		this.state = {
			chats: [],
			connectedUsers: {},
			activeChat: null,
			isSidebarOpen: false
		};
	}

	componentWillMount() {
		document.title = 'Chat';
		const { socket } = this.props;
		this.initSocket(socket);
		this.initNotification();
		window.addEventListener('mousemove', this.setCanNotify);
		window.addEventListener('keyup', this.setCanNotify);
		window.addEventListener('mouseenter', this.canNotNotify);
	}

	initSocket = socket => {
		socket.emit(COMMUNITY_CHAT, this.resetChat);
		socket.on(PRIVATE_MESSAGE, (chat, sender) => {
			this.addChat(chat);
			if (sender === this.props.user.name) {
				this.setActiveChat(chat);
			}
		});
		socket.on(USER_CONNECTED, connectedUsers => this.setState({ connectedUsers }));
		socket.on(USER_DISCONNECTED, (connectedUsers, disconnectedUser) => {
			const { chats, activeChat } = this.state;
			chats.forEach(chat => {
				if (chat.name === disconnectedUser) {
					if (chat === activeChat) this.setState({ activeChat: null, isSidebarOpen: true });
					chats.splice(chats.indexOf(chat), 1);
					this.setState({ chats });
				}
			});
			this.setState({ connectedUsers });
		});

		socket.on('connect', () => socket.emit(COMMUNITY_CHAT, this.resetChat));
	};

	sendPrivateMessage = receiver => {
		const { socket, user } = this.props;
		const { chats } = this.state;
		const chatExists = chats.reduce((exists, chat) => {
			if (receiver === chat.name) exists = true;
			return exists;
		}, false);

		if (!chatExists) socket.emit(PRIVATE_MESSAGE, { receiver, sender: user.name });
	};

	resetChat = chat => this.addChat(chat, true);

	addChat = (chat, reset = false) => {
		const { socket } = this.props;
		const { chats } = this.state;

		const _chats = reset ? [chat] : [...chats, chat];
		this.setState({ chats: _chats, activeChat: reset ? chat : this.state.activeChat });

		const messageEvent = `${ MESSAGE_RECEIVED }-${ chat.id }`;
		const typingEvent = `${ TYPING }-${ chat.id }`;

		socket.on(messageEvent, this.addMessageToChat(chat.id));
		socket.on(typingEvent, this.updateTypingInChat(chat.id));
	};

	addMessageToChat = chatId => {
		return message => {
			const { user } = this.props;
			const { chats } = this.state;

			const _chats = chats.map(chat => {
				if (chat.id === chatId) {
					if (chat !== this.state.activeChat) chat.unread++;
					chat.messages.push(message);
					if (message.message.split(' ')[0] !== user.name)
						message.sender !== this.props.user.name && this.notifyUser(chat.name, { body: message.type === 'text' ? message.message : 'Image' });
				}
				return chat;
			});
			this.setState({ chats: _chats });
		};
	};

	updateTypingInChat = chatId => {
		return ({ isTyping, user }) => {
			if (user !== this.props.user.name) {
				const { chats } = this.state;
				const _chats = chats.map(chat => {
					if (chat.id === chatId) {
						if (isTyping && !chat.typingUsers.includes(user)) {
							chat.typingUsers.push(user);
						}
						else if (!isTyping && chat.typingUsers.includes(user)) {
							chat.typingUsers = chat.typingUsers.filter(u => u !== user);
						}
					}
					return chat;
				});
				this.setState({ chats: _chats });
			}
		};
	};

	toggleSidebar = () => this.setState({ isSidebarOpen: !this.state.isSidebarOpen });

	closeSidebar = () => this.state.isSidebarOpen && this.setState({ isSidebarOpen: false });

	sendMessage = (chatId, message) => {
		const { socket } = this.props;
		socket.emit(MESSAGE_SENT, { chatId, message });
	};

	sendFile = (chatId, file) => {
		const { socket } = this.props;
		socket.emit(FILE_SENT, { chatId, file });
	};

	sendTyping = (chatId, isTyping) => {
		const { socket } = this.props;
		socket.emit(TYPING, { chatId, isTyping });
	};

	setActiveChat = activeChat => {
		const { chats } = this.state;
		const _chats = chats.map(chat => {
			if (chat.id === activeChat.id) {
				if (chat.unread > 0) {
					chat.unread = 0;
				}
			}
			return chat;
		});

		this.setState({ chat: _chats, activeChat });
	};

	initNotification = () => {
		if ("Notification" in window) {
			if (Notification.permission !== "granted") {
				if (Notification.permission !== "denied") {
					Notification.requestPermission(permission => {
						this.canNotify = permission === "granted";
					});
				}
			} else this.canNotify = true;
		}
	};

	notifyUser = (title, { body = '' }) => {
		if (this.canNotify) {
			try {
				new Notification(title, { body, icon: './favicon.ico' });
			} catch (e) {
				console.log('Notification Error!', e);
			}
		}
	};

	setCanNotify = () => {
		clearTimeout(this.timeout);
		if (this.canNotify) this.canNotify = false;
		else this.timeout = setTimeout(() => this.canNotify = true, 30000);
	};

	canNotNotify = () => {
		this.canNotify = false;
		clearTimeout(this.timeout);
	};

	componentWillUnmount() {
		clearTimeout(this.timeout);
	}

	render() {
		const { activeChat, chats, isSidebarOpen, connectedUsers } = this.state;
		const { logout, user } = this.props;
		return (
			<div className={ "Chat" }>
				<Sidebar user={ user } logout={ logout } chats={ chats } activeChat={ activeChat }
					setActiveChat={ this.setActiveChat } isSidebarOpen={ isSidebarOpen }
					connectedUsers={ connectedUsers }
					sendPrivateMessage={ this.sendPrivateMessage }
				/>
				<div className="ChatArea">
					{
						activeChat ?
							<div className={ "activeChat" } onClick={ this.closeSidebar }>
								<Heading name={ activeChat.name } toggleSidebar={ this.toggleSidebar } chats={ chats } />
								<Messages
									user={ user }
									typingUsers={ activeChat.typingUsers }
									messages={ activeChat.messages }
								/>
								<Input
									sendMessage={ message => this.sendMessage(activeChat.id, message) }
									sendTyping={ isTyping => this.sendTyping(activeChat.id, isTyping) }
									sendFile={ file => this.sendFile(activeChat.id, file) }
								/>
							</div>
							:
							<div className={ "welcome" }
							>
								<p>Select a Chat</p>
							</div>
					}
				</div>
			</div>
		);
	}
}


/* -------------------------------------------- */

/* -------------------------------------------- */


class Heading extends Component {
	render() {
		const { name, chats } = this.props;
		const unread = chats.some(chat => {
			return chat.unread > 0;
		});

		return (
			<div className={ "Heading" }>
				<div className={ "sidebar-toggle" }>
					<button onClick={ this.props.toggleSidebar }><span role={ "img" } aria-label="Sidebar Menu">👪</span>
					</button>
					{ unread && <div className="unread" /> }
				</div>
				<div className="active-chat">
					<div className="avatar">{ name[0].toUpperCase() }</div>
					<div className="name">{ name }</div>
				</div>
			</div>
		);
	}

}


/* -------------------------------------------- */

/* -------------------------------------------- */


class Messages extends Component {

	componentDidMount() {
		this.scrollDown();
	}

	componentDidUpdate() {
		this.scrollDown();
	}

	scrollDown = () => {
		this.refs.messages.scrollTop = this.refs.messages.scrollHeight;
	};

	displayMessage = (message, user) => {
		switch (message.type) {
			case 'text':
				if (message.sender) {
					if (message.sender === user.name) {

						return (
							<div
								key={ message.id }
								className={ 'message user' }
							>
								<div className="text">
									{
										message.message.toString().trim().split('\n').map((m, i) => {
											if (m === '') return <br key={ i } />;
											else return <p key={ i }>{ m.toString().trim() }</p>;
										})
									}
									<div className="meta">
										<div className="time">{ message.time }</div>
									</div>
								</div>
							</div>
						);
					} else {
						return (
							<div
								key={ message.id }
								className={ `message` }
							>
								<div className="text">
									{
										message.message.toString().trim().split('\n').map((m, i) => {
											if (m === '') return <br key={ i } />;
											else return <p key={ i }>{ m.toString().trim() }</p>;
										})
									}
									<div className="meta">
										<div className="time">{ message.time }</div>
										<div className="name">{ message.sender }</div>
									</div>
								</div>
							</div>
						);
					}
				} else {
					return (
						<div
							key={ message.id }
							className={ `message info` }
						>
							<div className="text">
								<div className="message-content">
									{ message.message }
								</div>
								<div className="meta">
									<div className="time">{ message.time }</div>
								</div>
							</div>
						</div>
					);
				}
			case 'image':
				if (message.sender === user.name) {
					return (
						<div
							key={ message.id }
							className={ 'message user' }
						>
							<div className="text">
								<div className="message-content">
									<img src={ message.message } alt={ `Sent by ${ message.sender }` } />
								</div>
								<div className="meta">
									<div className="time">{ message.time }</div>
								</div>
							</div>
						</div>
					);
				} else {
					return (
						<div key={ message.id } className="message image">
							<div className="text">
								<div className="message-content">
									<img src={ message.message } alt={ `Sent by ${ message.sender }` } />
								</div>
								<div className="meta">
									<div className="time">{ message.time }</div>
									<div className="name">{ message.sender }</div>
								</div>
							</div>
						</div>
					);
				}
			default:
				break;
		}
	};

	render() {
		const { messages = [], user, typingUsers = [] } = this.props;
		return (
			<div className={ "Messages" } ref={ "messages" }>
				{
					messages.map(message => this.displayMessage(message, user))
				}
				{
					typingUsers.length > 0 &&
					<div className="typing-users">
						<div className="typing">
							<span className="circle" />
							<span className="circle" />
							<span className="circle" />
						</div>
						<div className="name">{ `${ typingUsers.join(', ') }` }</div>
					</div>
				}
			</div>

		);
	}

}


/* -------------------------------------------- */

/* -------------------------------------------- */


class Input extends Component {
	constructor() {
		super();

		this.state = {
			message: '',
			isTyping: false
		};
	}

	componentDidMount() {
		this.refs.input.focus();
	}

	handleSubmit = e => {
		e && e.preventDefault();
		if (this.state.message.trim()) {
			this.sendMessage();
			this.setState({ message: '' }, () => this.stoppedTyping());
		}
	};

	sendMessage = () => this.props.sendMessage(this.state.message);

	handleChange = () => this.setState({ message: this.refs.input.value });

	sendTyping = e => {
		if (e.keyCode === 13 && e.ctrlKey) {
			this.handleSubmit();
		}
		const codes = [13, 16, 17, 18];
		if (codes.includes(e.keyCode)) return;

		this.lastUpdateTime = Date.now();
		if (!this.state.isTyping) {
			this.setState({ isTyping: true }, () => {
				this.props.sendTyping(true);
				this.startedTyping();
			});
		}
	};

	startedTyping = () => {
		this.typingInterval = setInterval(() => {
			if (Date.now() - this.lastUpdateTime > 1000) this.stoppedTyping();
		}, 1000);
	};

	stoppedTyping = () => {
		if (this.typingInterval) {
			this.setState({ isTyping: false }, () => {
				clearInterval(this.typingInterval);
				this.props.sendTyping(false);
			});
		}
	};

	componentWillUnmount() {
		// this.stoppedTyping();
		this.typingInterval && clearInterval(this.typingInterval);
	}

	handleFileChange = e => {
		if (e.target.files.length > 5) {
			return console.log('Max Files Length Exceeded');
		}
		Array.from(e.target.files).forEach(file => {
			if (file.type.includes('image')) {
				if (file.size < 700000) {
					const reader = new FileReader();
					reader.onload = e => {
						this.props.sendFile(e.target.result);
					};
					reader.readAsDataURL(file);
				} else {
					alert('File too large');
				}
			} else {
				alert('Invalid File Type, Only Images Allowed!');
			}
		});
	};

	render() {
		const { message } = this.state;

		return (
			<form className={ "Input" } onSubmit={ this.handleSubmit }>
				<div className={ "option" }>
					<button type={ "button" } onClick={ () => this.fileInput.click() }>
						<label htmlFor="attach-file">
							<span role={ "img" } aria-label={ "attach files" }>📎</span>
						</label>
						<input ref={ fileInput => this.fileInput = fileInput } type={ "file" } id={ "attach-file" } onChange={ this.handleFileChange } multiple accept={ "image/*" } />
					</button>
				</div>
				<div className={ "textarea" }>
					<textarea
						id={ "message" }
						ref={ "input" }
						autoComplete={ "off" }
						value={ message }
						placeholder={ "Type your message and press ctrl + Enter to send.." }
						onKeyUp={ this.sendTyping }
						onChange={ this.handleChange }
					/>
				</div>
				<div className={ "send" }>
					<button type={ "submit" } disabled={ message.length < 1 }>Send</button>
				</div>
			</form>

		);
	}
}


export default Chat;
