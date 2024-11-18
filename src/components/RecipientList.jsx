import React from 'react';
import './RecipientList.css'; // Import the CSS file

function RecipientsList({ recipients }) {
  return (
    <div className="recipients-container">
      <h2 className="recipients-title">Donation Recipients</h2>
      {recipients.length === 0 ? (
        <p className="no-recipients-message">Search for recipients.</p>
      ) : (
        <div className="table-wrapper">
          <table className="recipients-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Date recieved</th>
                <th>Type</th>
                <th>Amount in $</th>
                <th>Times of donations</th>
              </tr>
            </thead>
            <tbody>
              {recipients.map((recipient) => (
                <tr key={recipient.id} className="recipient-row">
                  <td data-label="Name">{recipient.name}</td>
                  <td data-label="Date recieved">{recipient.donationDate}</td>
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
