import React, { useState } from 'react';
import Auth from './components/Auth';
import MainPage from './components/MainPage';
import HistoryPage from './components/HistoryPage';
import './App.css';

const App = () => {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('main');

  if (!user) return <div className='app'><Auth onSignIn={setUser} /></div>;

  return (
    <div className='app'>
      {page === 'main' && <MainPage user={user} onGoToHistory={() => setPage('history')} />}
      {page === 'history' && <HistoryPage user={user} onBack={() => setPage('main')} />}
    </div>
  );
};

export default App;
