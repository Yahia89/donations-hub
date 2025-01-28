import React, { useEffect, useState } from 'react'
import { recipientService } from '../services/recipientService'

export function RecipientsList() {
  const [recipients, setRecipients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRecipients()
  }, [])

  const loadRecipients = async () => {
    try {
      const data = await recipientService.getRecipients()
      setRecipients(data)
    } catch (error) {
      console.error('Error loading recipients:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <h2>Recipients</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Contact Info</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {recipients.map((recipient) => (
            <tr key={recipient.id}>
              <td>{recipient.name}</td>
              <td>{recipient.contact_info}</td>
              <td>{recipient.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default RecipientsList