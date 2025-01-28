import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AddRecipientForm from './AddRecipientForm';
import RecipientList from './RecipientList';
import SearchBar from './SearchBar';
import { recipientService } from '../services/recipientService';
import { supabase } from '../lib/supabase';

const Home = () => {
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    try {
      setLoading(true);
      const { data } = await recipientService.searchRecipients(searchTerm);
      setRecipients(data || []);
    } catch (error) {
      console.error('Error searching recipients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearResults = () => {
    setSearchTerm('');
    setRecipients([]);
  };

  return (
    <div className="home-container">
      <div style={{ display: 'flex', flexDirection:"column", justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h1>Donations Hub Dashboard</h1>
        <button 
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Log Out
        </button>
      </div>
      <SearchBar 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onSearch={handleSearch}
        onClearResults={handleClearResults}
        loading={loading}
      />
      <AddRecipientForm />
      <RecipientList recipients={recipients} />
    </div>
  );
};

export default Home;
