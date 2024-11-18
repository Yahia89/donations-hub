import React from 'react';
import './RecipientList.css';

function RecipientsList({ recipients, message }) {
  return (
    <div className="recipients-container">
      <h2 className="recipients-title">Donation Recipients</h2>
      {recipients.length === 0 && message && (
        <p className="no-recipients-message">{message}</p> // Display the message only when no results found
      )}
      {recipients.length > 0 && (
        <div className="table-wrapper">
          <table className="recipients-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Date received</th>
                <th>Type</th>
                <th>Amount in $</th>
                <th>Times of donations</th>
              </tr>
            </thead>
            <tbody>
              {recipients.map((recipient) => (
                <tr key={recipient.id} className="recipient-row">
                  <td data-label="Name">{recipient.name}</td>
                  <td data-label="Date received">{recipient.donationDate}</td>
                  <td data-label="Type">{recipient.donationType}</td>
                  <td data-label="Amount ($)">{recipient.donationAmount}</td>
                  <td data-label="How many times?">{recipient.numDonations}</td>
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
