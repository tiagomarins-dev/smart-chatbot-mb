import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Contact } from '../../interfaces';
import { useAuth } from '../../contexts/AuthContext';

// Import the API client if it exists
let contactsApi: any;
try {
  contactsApi = require('../../api/contacts').default;
} catch (error) {
  console.warn('ContactsApi not available, using mock data');
}

interface ContactFormProps {
  contact?: Contact;
  isEdit?: boolean;
}

const ContactForm: React.FC<ContactFormProps> = ({ contact, isEdit = false }) => {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<{
    first_name: string;
    last_name: string;
    phone_number: string;
    email: string;
    tags: string;
    custom_fields: Record<string, string>;
  }>({
    first_name: contact?.first_name || '',
    last_name: contact?.last_name || '',
    phone_number: contact?.phone_number || '',
    email: contact?.email || '',
    tags: contact?.tags?.join(', ') || '',
    custom_fields: contact?.custom_fields || {},
  });

  // For managing custom fields
  const [customFieldKeys, setCustomFieldKeys] = useState<string[]>(
    contact?.custom_fields ? Object.keys(contact.custom_fields) : []
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCustomFieldChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      custom_fields: {
        ...prev.custom_fields,
        [key]: value,
      },
    }));
  };

  const addCustomField = () => {
    const newKey = `field_${customFieldKeys.length + 1}`;
    setCustomFieldKeys(prev => [...prev, newKey]);
    setFormData(prev => ({
      ...prev,
      custom_fields: {
        ...prev.custom_fields,
        [newKey]: '',
      },
    }));
  };

  const removeCustomField = (key: string) => {
    setCustomFieldKeys(prev => prev.filter(k => k !== key));
    setFormData(prev => {
      const newCustomFields = { ...prev.custom_fields };
      delete newCustomFields[key];
      return {
        ...prev,
        custom_fields: newCustomFields,
      };
    });
  };

  const handleCustomFieldKeyChange = (oldKey: string, newKey: string) => {
    if (newKey.trim() === '') return;
    
    // Update the keys array
    setCustomFieldKeys(prev => prev.map(k => k === oldKey ? newKey : k));
    
    // Update the custom fields object
    setFormData(prev => {
      const newCustomFields = { ...prev.custom_fields };
      const value = newCustomFields[oldKey];
      delete newCustomFields[oldKey];
      newCustomFields[newKey] = value;
      return {
        ...prev,
        custom_fields: newCustomFields,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Process tags from comma-separated string to array
    const tags = formData.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag !== '');

    try {
      if (contactsApi) {
        if (isEdit && contact?.id) {
          // Update existing contact
          const response = await contactsApi.updateContact(contact.id, {
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone_number: formData.phone_number,
            email: formData.email,
            tags,
            custom_fields: formData.custom_fields,
          });

          if (response.success) {
            setSuccess('Contact updated successfully');
            // Redirect after a short delay
            setTimeout(() => {
              router.push(`/contacts/${contact.id}`);
            }, 1500);
          } else {
            setError(response.error || 'Failed to update contact');
          }
        } else {
          // Create new contact
          const response = await contactsApi.createContact({
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone_number: formData.phone_number,
            email: formData.email,
            tags,
            custom_fields: formData.custom_fields,
            user_id: user?.id,
          });

          if (response.success) {
            setSuccess('Contact created successfully');
            // Reset the form if not redirecting
            setFormData({
              first_name: '',
              last_name: '',
              phone_number: '',
              email: '',
              tags: '',
              custom_fields: {},
            });
            setCustomFieldKeys([]);
            // Redirect after a short delay
            setTimeout(() => {
              router.push('/contacts');
            }, 1500);
          } else {
            setError(response.error || 'Failed to create contact');
          }
        }
      } else {
        // Mock API for development
        // Just simulate a successful operation
        setSuccess(isEdit ? 'Contact updated successfully' : 'Contact created successfully');
        
        setTimeout(() => {
          router.push(isEdit && contact?.id ? `/contacts/${contact.id}` : '/contacts');
        }, 1500);
      }
    } catch (err) {
      console.error('Error submitting contact:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h5 className="card-title">{isEdit ? 'Edit Contact' : 'Create New Contact'}</h5>
      </div>
      <div className="card-body">
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="row mb-3">
            <div className="col-md-6">
              <label htmlFor="first_name" className="form-label">First Name</label>
              <input
                type="text"
                className="form-control"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="last_name" className="form-label">Last Name</label>
              <input
                type="text"
                className="form-control"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="phone_number" className="form-label">Phone Number</label>
            <input
              type="tel"
              className="form-control"
              id="phone_number"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              required
              placeholder="+1234567890"
            />
            <div className="form-text">Please include the country code (e.g., +1 for USA)</div>
          </div>

          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="mb-3">
            <label htmlFor="tags" className="form-label">Tags</label>
            <input
              type="text"
              className="form-control"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="tag1, tag2, tag3"
            />
            <div className="form-text">Separate tags with commas</div>
          </div>

          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <label className="form-label mb-0">Custom Fields</label>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={addCustomField}
              >
                Add Field
              </button>
            </div>
            
            {customFieldKeys.length === 0 && (
              <div className="text-muted small mb-3">No custom fields added yet</div>
            )}
            
            {customFieldKeys.map((key) => (
              <div key={key} className="row mb-2 align-items-center">
                <div className="col-5">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={key}
                    onChange={(e) => handleCustomFieldKeyChange(key, e.target.value)}
                    placeholder="Field name"
                  />
                </div>
                <div className="col-6">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={formData.custom_fields[key] || ''}
                    onChange={(e) => handleCustomFieldChange(key, e.target.value)}
                    placeholder="Value"
                  />
                </div>
                <div className="col-1">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => removeCustomField(key)}
                  >
                    &times;
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="d-flex justify-content-between">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => router.back()}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Saving...
                </>
              ) : (
                isEdit ? 'Update Contact' : 'Create Contact'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactForm;