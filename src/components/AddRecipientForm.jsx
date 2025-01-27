import React, { useState } from 'react';
import { recipientService } from '../services/recipientService';
import './AddRecipientForm.css';

function AddRecipientForm() {
  const [formData, setFormData] = useState({
    name: '',
    donation_date: '',
    donation_type: '',
    donation_amount: '',
    donations_count: 0,
    status: 'active',
    contact_info: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prepare recipient data with donations
    const recipientData = {
      ...formData,
      donations_count: Number(formData.donations_count), // Ensure it's a number
      donation_amount: formData.donation_amount || 'N/A', // Handle donation amount
      donations: [{
        type: formData.donation_type,
        date: formData.donation_date,
        amount: formData.donation_amount || 'N/A' // Add fallback for empty donation amount
      }]
    };
  
    try {
      console.log('Adding recipient data:', recipientData);  // Debugging line
  
      // Insert recipient data into Supabase
await recipientService.addRecipient(recipientData);
      
      // Clear form
      setFormData({
        name: '',
        donation_date: '',
        donation_type: '',
        donation_amount: '',
        donations_count: 0,
        status: 'active',
        contact_info: ''
      });
      
      alert('Recipient added successfully!');
    } catch (error) {
      console.error('Error adding recipient:', error);
      alert('Failed to add recipient');
    }
  };
  

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <form className="form-container" onSubmit={handleSubmit}>
      <input
        className="form-input"
        type="text"
        name="name"
        placeholder="Recipient Name"
        value={formData.name}
        onChange={handleChange}
        required
      />
      <input
        className="form-input"
        type="text"
        name="contact_info"
        placeholder="Contact Information"
        value={formData.contact_info}
        onChange={handleChange}
      />
      <input
        className="form-input"
        type="date"
        name="donation_date"
        placeholder="Date of Donation"
        value={formData.donation_date}
        onChange={handleChange}
        required
      />
      <input
        className="form-input"
        type="text"
        name="donation_type"
        placeholder="Type of Donation"
        value={formData.donation_type}
        onChange={handleChange}
        required
      />
      <input
        className="form-input"
        type="text"
        name="donation_amount"
        placeholder="Donation Amount (worth) in $"
        value={formData.donation_amount}
        onChange={handleChange}
      />
      <input
        className="form-input"
        type="number"
        name="donations_count"
        placeholder="How many times recipient received donations?"
        value={formData.donations_count}
        onChange={handleChange}
      />
      <button className="form-button" type="submit">
        Add Recipient
      </button>
    </form>
  );
}

export default AddRecipientForm;
