import Link from 'next/link';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { USER_CONNECTED } from '../server/utils/events';
import Chat from '../components/Chat/Chat';
import Login from '../components/Login/Login';

export default function Home() {
  const [socket, setSocket] = useState(null);
  const [user, setUser] = useState(null);

  const init = () => {
    const socket = io('/');
    socket.on('connect', () => setSocket(socket));
  };

  useEffect(() => init(), []);

  const login = user => {
    setUser(user);
    socket.emit(USER_CONNECTED, user);
  };

  const logout = () => {
    setUser(null);
    socket.disconnect();
    init();
  };

  return (
    <>
      {
        user ? <Chat socket={ socket } user={ user } logout={ logout } />
          : <Login socket={ socket } login={ login } />
      }
    </>
  );
}
