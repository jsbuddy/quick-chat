import React, { useState, useRef } from 'react';
import { VERIFY_USER } from '../../server/utils/events';

const Login = ({ login, socket }) => {
	const [nickname, setNickname] = useState('');
	const [error, setError] = useState('');
	const [canSubmit, setCanSubmit] = useState(false);
	const inputEl = useRef(null);

	const handleChange = e => {
		if (e.target.value.length < 1) {
			setCanSubmit(false);
			setError('Your nickname is required!');
		}
		else if (e.target.value.length < 3) {
			setCanSubmit(false);
			setError('Nickname is too short!');
		}
		else if (e.target.value.length > 15) {
			setCanSubmit(false);
			setError('Nickname is too long!');
		} else {
			setCanSubmit(true);
			setError('');
		}
		setNickname(e.target.value);
	};

	const setUser = ({ exists, user }) => {
		const input = inputEl.current;
		if (exists) {
			setError('Nickname Taken!');
			input.classList.add('submit-error');
			setTimeout(() => input.classList.remove('submit-error'), 200);
		}
		else {
			setError('');
			login(user);
		};
	};

	const handleSubmit = e => {
		e.preventDefault();
		const input = inputEl.current;
		if (input.value.length < 1) {
			setCanSubmit(false);
			setError('Nickname is required');
		}
		if (canSubmit) {
			if (socket) socket.emit(VERIFY_USER, nickname, setUser);
			else {
				input.classList.add('error');
				input.classList.add('submit-error');
				input.classList.remove('success');
				setTimeout(() => input.classList.remove('submit-error'), 200);
				setError('Network Error');
			}
		} else {
			input.classList.add('error');
			input.classList.add('submit-error');
			input.classList.remove('success');
			setTimeout(() => input.classList.remove('submit-error'), 200);
		}
	};

	return (
		<>
			<div className={ "Login" }>
				<div className="wrap">
					<form onSubmit={ handleSubmit }>
						<input
							autoComplete="off"
							ref={ inputEl }
							type="text"
							placeholder="Choose a Nickname.."
							value={ nickname }
							onChange={ handleChange }
						/>
					</form>
					{ error && <div className="message error">{ error }</div> }
					{ nickname.length > 2 && !error && <div className="message success">Press enter to continue</div> }
				</div>
			</div>
			<style lang="scss" jsx>{ `
				.Login {
					/* background-color: rgba(0, 163, 255, 0.71); */
					background-image: linear-gradient(60deg, #29323c 0%, #485563 100%);
					width: 100%;
					height: 100vh;
					display: flex;
					justify-content: center;
				}
				
				.Login .wrap {
					flex: 0 1 800px;
					margin-top: 80px;
					text-align: center;
					padding: 20px;
				}
				
				.Login .wrap input {
					border: 0;
					width: 100%;
					font-size: 1.3em;
					color: #888;
					padding: 2rem 3rem;
					border-radius: 100px;
					transition: all .2s ease-in-out;
					box-shadow: 0 30px 50px -20px rgba(0, 0, 0, .2),
					18px 0 40px -10px rgba(0, 0, 0, .1),
					-18px 0 40px -10px rgba(0, 0, 0, .1);
					outline: none;
				}
				
				.Login .wrap input.success {
					border-left: 8px solid #81d65f
				}
				
				.Login .wrap input.error {
					border-left: 8px solid #ff7d7d;
				}
				
				.Login .wrap input:focus {
					transform: translateY(-5px);
					box-shadow: 0 50px 50px -20px rgba(0, 0, 0, .2),
					18px 0 40px -10px rgba(0, 0, 0, .1),
					-18px 0 40px -10px rgba(0, 0, 0, .1);
				}
				
				.Login .wrap .message {
					margin: 50px 0;
					display: inline-flex;
					padding: .8em 2em;
					background-color: #999;
					border-radius: 60px;
					color: #fff;
					font-size: .8em;
					letter-spacing: .021em;
				}
				
				.Login .wrap .message.error {
					background-color: #f44336;
					color: #eee;
				}
				
				.Login .wrap .message.success {
					background-color: #4CAF50;
					color: #eee;
				}
				
				.submit-error {
					animation: shake .2s ease-in-out forwards;
				}
				
				@keyframes shake {
					0% {
						transform: rotate(0deg);
					}
					20% {
						transform: rotate(1deg);
					}
					40% {
						transform: rotate(-1deg);
					}
					60% {
						transform: rotate(1deg);
					}
					80% {
						transform: rotate(-1deg);
					}
					100% {
						transform: rotate(0deg);
					}
				}
			`}</style>
		</>
	);
};


export default Login;
