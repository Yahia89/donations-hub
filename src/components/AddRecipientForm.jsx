import React, { useState } from 'react';
import './AddRecipientForm.css'

function AddRecipientForm({ onAdd }) {
  const [name, setName] = useState('');
  const [donationDate, setDonationDate] = useState('');
  const [donationType, setDonationType] = useState('');
  const [donationAmount, setDonationAmount] = useState('');
  const [numDonations, setNumDonations] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (name && donationDate && donationType) {
      const newRecipient = {
        id: Date.now(),
        name,
        donationDate,
        donationType,
        donationAmount: donationAmount || 'N/A',
        numDonations: numDonations || 0,
        donations: [
          {
            type: donationType,
            date: donationDate,
            amount: donationAmount || 'N/A',
          },
        ],
      };

      // Mock API request: instead of making a real POST request, we just call onAdd to update local state
      onAdd(newRecipient);

      // Clear the form fields
      setName('');
      setDonationDate('');
      setDonationType('');
      setDonationAmount('');
      setNumDonations('');
    }
  };

  return (
    <form className="form-container" onSubmit={handleSubmit}>
      <input
        className="form-input"
        type="text"
        placeholder="Recipient Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        className="form-input"
        type="date"
        placeholder="Date of Donation"
        value={donationDate}
        onChange={(e) => setDonationDate(e.target.value)}
        required
      />
      <input
        className="form-input"
        type="text"
        placeholder="Type of Donation"
        value={donationType}
        onChange={(e) => setDonationType(e.target.value)}
        required
      />
      <input
        className="form-input"
        type="text"
        placeholder="Donation Amount (worth) in $"
        value={donationAmount}
        onChange={(e) => setDonationAmount(e.target.value)}
      />
      <input
        className="form-input"
        type="number"
        placeholder="How many times recipient received donations?"
        value={numDonations}
        onChange={(e) => setNumDonations(e.target.value)}
      />
      <button className="form-button" type="submit">
        Add Recipient
      </button>
    </form>
  );
}  

export default AddRecipientForm;
