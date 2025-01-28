import { useState } from 'react';
import { supabase } from '../lib/supabase';
import './LogIn.css';

const LogIn = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const redirectURL =
        process.env.NODE_ENV === "development"
          ? "http://localhost:5173"
          : "https://yahia89.github.io/donations-hub/";

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectURL,
        }
      });

      if (error) {
        if (error.message === 'Signups not allowed for this instance') {
          throw new Error('No user found or no matching email found. Please contact admin to register.');
        }
        throw error;
      }

      setMessage('If this email is registered, you will receive a login link.');
    } catch (error) {
      setMessage(error.message);
      console.error('Error:', error);
    }

    setLoading(false);
  };

  return (
    <div className="login-container">
      <p className='welcome'>Welcome to Donations Hub</p>
      <p>Enter your email to receive a magic link for secure login</p>

      <form onSubmit={handleLogin}>
        <input
          className='login-input'
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send Magic Link'}
        </button>
        <p style={{ marginTop: "50px" }}>
          If you are registered, you will receive a login link. Click on it to log in.
        </p>
        <p style={{ marginTop: "50px" }}>
          Please contact <a 
            href="mailto:info@techdevprime.com"
            style={{
              color: 'darkgray',
              textDecoration: 'underline',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            admin
          </a> for comments, concerns & any suggestions.
        </p>
      </form>

      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default LogIn;
