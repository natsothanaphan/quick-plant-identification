import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword,
  setPersistence, browserSessionPersistence, onAuthStateChanged } from 'firebase/auth';
import './Auth.css';
import { alertAndLogErr } from '../utils';

const Auth = ({ onSignIn }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);

  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      await setPersistence(auth, browserSessionPersistence);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      onSignIn(userCredential.user);
    } catch (err) {
      alertAndLogErr(err);
    }
  };

  useEffect(() => onAuthStateChanged(auth, (user) => {
    setLoading(false);
    if (user) onSignIn(user);
  }), []);

  if (loading) return <p>Loading...</p>;

  return (
    <>
      <form className='auth-form' onSubmit={handleSignIn}>
        <div>
          <label htmlFor='.auth-email'>Email</label>
          <input id='.auth-email' type='email' value={email}
            onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label htmlFor='.auth-password'>Password</label>
          <input id='.auth-password' type='password' value={password}
            onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type='submit'>Sign in</button>
      </form>
    </>
  );
};

export default Auth;
