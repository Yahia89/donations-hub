import React, { useState, useEffect } from 'react';
import AddRecipientForm from './components/AddRecipientForm';
import RecipientsList from './components/RecipientList';
import SearchBar from './components/SearchBar';

function App() {
  const [recipients, setRecipients] = useState([]);
  const [filteredRecipients, setFilteredRecipients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInitiated, setSearchInitiated] = useState(false); // Track if search has been made

  // Fetch recipients only when a search term is entered
  const fetchRecipients = async (searchTerm) => {
    try {
      setLoading(true);
      const response = await fetch('https://raw.githubusercontent.com/Yahia89/donations-hub/refs/heads/master/data/recipients.json');
      const data = await response.json();
      const filtered = data.filter((recipient) =>
        recipient.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setRecipients(data); // Save all recipients (in case you want to search again)
      setFilteredRecipients(filtered); // Set filtered list based on the search
    } catch (error) {
      console.error('Error loading recipients:', error);
    }
    setLoading(false);
  };

  // Handle adding a new recipient
  const handleAddRecipient = (newRecipient) => {
    const updatedRecipients = [...recipients, newRecipient];
    setRecipients(updatedRecipients);
    setFilteredRecipients(updatedRecipients); // Update filtered list
  };

  // Handle search functionality
  const handleSearch = (searchTerm) => {
    setSearchTerm(searchTerm);
    setSearchInitiated(true); // Mark that the search was initiated
    if (searchTerm.trim() === '') {
      setFilteredRecipients([]); // Clear filtered results when search term is empty
    } else {
      fetchRecipients(searchTerm); // Fetch filtered recipients based on search term
    }
  };

  // Handle clearing search results
  const handleClearResults = () => {
    setSearchInitiated(false); // Reset search initiated state
    setSearchTerm(''); // Clear the search term
    setFilteredRecipients([]); // Clear filtered recipients
  };

  return (
    <div className="app-container">
      <h1 className="app-title">Donation Hub</h1>
      <SearchBar onSearch={handleSearch} onClearResults={handleClearResults} loading={loading} />
      <AddRecipientForm onAdd={handleAddRecipient} />
      {searchInitiated ? (
        filteredRecipients.length === 0 ? (
          <h1>No results found</h1> // If no results are found after a search
        ) : (
          <RecipientsList recipients={filteredRecipients} />
        )
      ) : (
        <h1>Start searching</h1> // Show this message before any search is done
      )}
    </div>
  );
}

export default App;
