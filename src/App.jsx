import React, { useState, useEffect } from 'react';
import AddRecipientForm from './components/AddRecipientForm';
import RecipientsList from './components/RecipientList';
import SearchBar from './components/SearchBar';
import AddRecipient from './components/AddRecipient';
import { recipientService } from './services/recipientService';

function App() {
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchInitiated, setSearchInitiated] = useState(false);

  const handleSearch = async (searchTerm) => {
    try {
      setLoading(true);
      setSearchInitiated(true);
      
      const { data, error } = await recipientService.searchRecipients(searchTerm);
      if (error) throw error;
      
      setRecipients(data || []);
    } catch (error) {
      console.error('Error searching recipients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearResults = () => {
    setSearchInitiated(false);
    setRecipients([]);
  };

  return (
    <div className="app-container">
      <h1 className="app-title">Donation Hub</h1>
      <SearchBar 
        onSearch={handleSearch} 
        onClearResults={handleClearResults} 
        loading={loading} 
      />
      <AddRecipientForm />
      <RecipientsList 
        recipients={recipients} 
        message={searchInitiated ? "No results found" : "Start searching"}
      />
    </div>
  );
}

export default App;
