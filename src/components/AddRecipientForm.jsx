// AddRecipientForm.jsx
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

      try {
        const response = await fetch('https://yahia89.github.io/donations-hub/recipients', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newRecipient),
        });

        if (response.ok) {
          onAdd(newRecipient);
          // Clear the form fields
          setName('');
          setDonationDate('');
          setDonationType('');
          setDonationAmount('');
          setNumDonations('');
        } else {
          console.error('Failed to add recipient');
        }
      } catch (error) {
        console.error('Error:', error);
      }
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
        placeholder="How many times recipient recieved donations?"
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