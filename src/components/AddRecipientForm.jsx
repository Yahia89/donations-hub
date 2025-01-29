import React, { useState } from 'react';
import { recipientService } from '../services/recipientService';
import './AddRecipientForm.css';

function AddRecipientForm() {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    marital_status: '',
    other_status: '',
    donation_date: '',
    donation_type: '',
    donation_amount: '',
    donations_count: 0,
    status: 'active',
    contact_info: '',
    address: '',
    driver_license: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const recipientData = {
      ...formData,
      age: Number(formData.age) || 0, 
      donations_count: Number(formData.donations_count) || 0, 
      donation_amount: formData.donation_amount ? parseFloat(formData.donation_amount).toFixed(2) : '0.00',
      donations: [
        {
          type: formData.donation_type || 'N/A',
          date: formData.donation_date || 'N/A',
          amount: formData.donation_amount ? parseFloat(formData.donation_amount).toFixed(2) : '0.00'
        }
      ]
    };

    try {
      console.log('Adding recipient data:', recipientData);
      await recipientService.addRecipient(recipientData);

      setFormData({
        name: '',
        age: '',
        marital_status: '',
        other_status: '',
        donation_date: '',
        donation_type: '',
        donation_amount: '',
        donations_count: 0,
        status: 'active',
        contact_info: '',
        address: '',
        driver_license: ''
      });

      alert('Recipient added successfully!');
    } catch (error) {
      console.error('Error adding recipient:', error);
      alert('Failed to add recipient');
    }
  };

  const formatPhoneNumber = (value) => {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, '');
    if (phoneNumber.length < 4) return phoneNumber;
    if (phoneNumber.length < 7) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    }
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  };

  const formatDriverLicense = (value) => value.replace(/[^\w]/g, '').toUpperCase();
  
  const formatDonationAmount = (value) => value.replace(/[^\d.]/g, '');

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'contact_info' ? formatPhoneNumber(value)
            : name === 'driver_license' ? formatDriverLicense(value)
            : name === 'donation_amount' ? formatDonationAmount(value)
            : name === 'age' || name === 'donations_count' ? Math.max(0, Number(value)) || '' // Prevent negatives
            : value
    }));
  };

  const handleMaritalStatusChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      marital_status: e.target.value,
      other_status: e.target.value !== 'Other' ? '' : prev.other_status
    }));
  };

  return (
    <form className="form-container" onSubmit={handleSubmit}>
      <input className="form-input" type="text" name="name" placeholder="Recipient Name" value={formData.name} onChange={handleChange} required />
      <input className="form-input" type="text" name="driver_license" placeholder="Driver License Number" value={formData.driver_license} onChange={handleChange} maxLength={12} />
      <input className="form-input" type="tel" name="contact_info" placeholder="Phone: (123) 456-7890" value={formData.contact_info} onChange={handleChange} maxLength={14} />
      <input className="form-input" type="number" name="age" placeholder="How old are you?" value={formData.age} onChange={handleChange} min="0" max="120" required />
      <div className="form-input marital-status-group">
        <label>Marital Status:</label>
        <div className="radio-group">
          <label><input type="radio" name="marital_status" value="Single" checked={formData.marital_status === 'Single'} onChange={handleMaritalStatusChange} /> Single</label>
          <label><input type="radio" name="marital_status" value="Married" checked={formData.marital_status === 'Married'} onChange={handleMaritalStatusChange} /> Married</label>
          <label><input type="radio" name="marital_status" value="Other" checked={formData.marital_status === 'Other'} onChange={handleMaritalStatusChange} /> Other</label>
        </div>
        {formData.marital_status === 'Other' && (
          <select className="form-input" name="other_status" value={formData.other_status} onChange={handleChange}>
            <option value="">Select Status</option>
            <option value="Widowed">Widowed</option>
            <option value="Divorced">Divorced</option>
          </select>
        )}
      </div>
      <input className="form-input" type="text" name="address" placeholder="Street, City, State ZIP" value={formData.address} onChange={handleChange} />
      <input className="form-input" type="date" name="donation_date" placeholder="Date of Donation" value={formData.donation_date} onChange={handleChange} required />
      <input className="form-input" type="text" name="donation_type" placeholder="Type of Donation" value={formData.donation_type} onChange={handleChange} required />
      <input className="form-input" type="text" name="donation_amount" placeholder="Donation Amount (worth) in $" value={formData.donation_amount} onChange={handleChange} />
      <input className="form-input" type="number" name="donations_count" placeholder="How many times recipient received donations?" value={formData.donations_count} onChange={handleChange} />
      <button className="form-button" type="submit">Add Recipient</button>
    </form>
  );
}

export default AddRecipientForm;
