import React, { useState } from 'react'
import { recipientService } from '../services/recipientService'

export function AddRecipient() {
  const [formData, setFormData] = useState({
    name: '',
    contact_info: '',
    status: 'active'
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await recipientService.addRecipient(formData)
      setFormData({ name: '', contact_info: '', status: 'active' })
      alert('Recipient added successfully!')
    } catch (error) {
      console.error('Error adding recipient:', error)
      alert('Failed to add recipient')
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="name">Name:</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label htmlFor="contact_info">Contact Info:</label>
        <input
          type="text"
          id="contact_info"
          name="contact_info"
          value={formData.contact_info}
          onChange={handleChange}
          required
        />
      </div>
      <button type="submit">Add Recipient</button>
    </form>
  )
}

export default AddRecipient