import React, { useState } from 'react';
import Auth from './components/Auth';
import MainPage from './components/MainPage';
import './App.css';

const App = () => {
  const [user, setUser] = useState(null);

  if (!user) return <div className='app'><Auth onSignIn={setUser} /></div>;

  return (
    <div className='app'>
      <MainPage user={user} />
    </div>
  );
};

export default App;
