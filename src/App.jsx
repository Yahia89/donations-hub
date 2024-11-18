import React, { useState, useEffect } from 'react';
import AddRecipientForm from './components/AddRecipientForm';
import RecipientsList from './components/RecipientList';
import SearchBar from './components/SearchBar';

function App() {
  const [recipients, setRecipients] = useState([]);
  const [filteredRecipients, setFilteredRecipients] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load initial data
  useEffect(() => {
    fetchRecipients();
  }, []);

  // Fetch recipients from JSON file
  const fetchRecipients = async () => {
    try {
      const response = await fetch('https://yahia89.github.io/donations-hub/recipients');
      const data = await response.json();
      setRecipients(data);
      setFilteredRecipients(data); // Ensure both states are initialized
    } catch (error) {
      console.error('Error loading recipients:', error);
    }
  };

  const handleAddRecipient = (newRecipient) => {
    const updatedRecipients = [...recipients, newRecipient];
    setRecipients(updatedRecipients);
    setFilteredRecipients(updatedRecipients); // Update filtered list
  };

  const handleSearch = async (searchTerm) => {
    setLoading(true);
    try {
      const response = await fetch(`https://yahia89.github.io/donations-hub/search-recipients?name=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();
      console.log('Filtered Results:', data); // Debug line to check filtered output
      setFilteredRecipients(data);
      console.log('Updated filteredRecipients:', data); // Check if state is being updated
    } catch (error) {
      console.error('Error searching recipients:', error);
    }
    setLoading(false);
  };

  const handleClearResults = () => {
    setFilteredRecipients(recipients); // Reset to the full list
  };

  return (
    <div className="app-container">
      <h1 className="app-title">Donation Hub</h1>
      <SearchBar onSearch={handleSearch} onClearResults={handleClearResults} loading={loading} />
      <AddRecipientForm onAdd={handleAddRecipient} />
      <RecipientsList recipients={filteredRecipients.length > 0 ? filteredRecipients : []} />
    </div>
  );
}

export default App;
