import React from 'react';
import './RecipientList.css';

function RecipientsList({ recipients = [], message }) {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="recipients-container">
      <h2 className="recipients-title">Donation Recipients</h2>
      {(!recipients || recipients.length === 0) && message && (
        <p className="no-recipients-message">{message}</p>
      )}
      {recipients && recipients.length > 0 && (
        <div className="table-wrapper">
          <table className="recipients-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact Info</th>
                <th>Date received</th>
                <th>Type</th>
                <th>Amount in $</th>
                <th>Times of donations</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recipients.map((recipient) => (
                <tr key={recipient.id} className="recipient-row">
                  <td data-label="Name">{recipient.name}</td>
                  <td data-label="Contact">{recipient.contact_info || 'N/A'}</td>
                  <td data-label="Date received">{formatDate(recipient.donation_date)}</td>
                  <td data-label="Type">{recipient.donation_type || 'N/A'}</td>
                  <td data-label="Amount ($)">{recipient.donation_amount || 'N/A'}</td>
                  <td data-label="How many times?">{recipient.donations_count || 0}</td>
                  <td data-label="Status">{recipient.status || 'active'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default RecipientsList;
