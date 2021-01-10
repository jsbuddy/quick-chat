import React, { Component } from 'react';

class Sidebar extends Component {
	constructor(props) {
		super(props);

		this.state = {
			showing: 'chats'
		};
	}

	setShowing = showing => this.setState({ showing });

	render() {
		const { activeChat, chats, user, setActiveChat, logout, isSidebarOpen, connectedUsers, sendPrivateMessage } = this.props;
		const chatNames = chats.map(chat => chat.name);
		const { showing } = this.state;
		return (
			<div className={ `Sidebar ${ isSidebarOpen ? 'open' : '' }` }>
				<div className="top">
				</div>
				<div className="middle" ref={ "user" }>
					<div className="menu">
						<div className={ `menu-item ${ showing === 'chats' && 'active' }` }
							onClick={ () => this.setShowing('chats') }>Chats
						</div>
						<div className={ `menu-item ${ showing === 'users' && 'active' }` }
							onClick={ () => this.setShowing('users') }>Users
						</div>
					</div>
					{
						showing === 'chats' &&
						chats.map(chat =>
							chat.name &&
							<div
								key={ chat.id }
								className={ `chat ${ activeChat && activeChat.id === chat.id && 'active' }` }
								onClick={ () => setActiveChat(chat) }
							>
								<div className="avatar">
									<span>{ chat.name[0].toUpperCase() }</span>
								</div>
								<div className="content">
									<div className="name">{ chat.name }</div>
									{
										chat.messages.length > 0 &&
										<div className="last-message">
											{
												chat.messages[chat.messages.length - 1].type === 'text'
													? chat.messages[chat.messages.length - 1].message
													: 'Image'
											}

										</div>
									}
									{
										chat.unread > 0 &&
										<div className="unread">{ chat.unread }</div>
									}
								</div>
							</div>
						)
					}
					<div className="users">
						{
							showing === 'users' &&
							Object.keys(connectedUsers).map(key => {
								const _user = connectedUsers[key];
								return (_user.name && user.id !== connectedUsers[key].id) &&
									<div
										key={ _user.id }
										className={ `user ${ chatNames.includes(_user.name) && 'chatting' }` }
										title={ `Start conversation with ${ _user.name }` }
										onClick={ () => sendPrivateMessage(_user.name) }
									>
										<div className="avatar">
											<span>{ _user.name[0].toUpperCase() }</span>
										</div>
										<div className="name">{ _user.name }</div>
									</div>;
							}
							)
						}
					</div>
				</div>
				<div className="bottom">
					<div className="user">
						<div className="avatar">
							<span>{ user.name[0].toUpperCase() }</span>
						</div>
						<div className="name">{ user.name }</div>
						<div className="logout-btn">
							<button type={ "button" } onClick={ logout }>Logout</button>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

export default Sidebar;
