import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Company } from '../../interfaces';
import companiesApi from '../../api/companies';

interface CompanyFormProps {
  company?: Company;
  isEdit?: boolean;
}

const CompanyForm: React.FC<CompanyFormProps> = ({ company, isEdit = false }) => {
  const router = useRouter();
  const [name, setName] = useState(company?.name || '');
  const [isActive, setIsActive] = useState(company?.is_active ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (company) {
      setName(company.name);
      setIsActive(company.is_active);
    }
  }, [company]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Company name is required');
      return;
    }

    try {
      setLoading(true);
      
      if (isEdit && company?.id) {
        // Update existing company
        const response = await companiesApi.updateCompany(company.id, {
          name: name.trim(),
          is_active: isActive
        });
        
        if (response.success) {
          router.push('/companies');
        } else {
          setError(response.error || 'Failed to update company');
        }
      } else {
        // Create new company
        const response = await companiesApi.createCompany({
          name: name.trim()
        });
        
        if (response.success) {
          router.push('/companies');
        } else {
          setError(response.error || 'Failed to create company');
        }
      }
    } catch (err) {
      console.error('Error saving company:', err);
      setError('An error occurred while saving the company');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-body">
        <h5 className="card-title mb-4">
          {isEdit ? 'Edit Company' : 'Create New Company'}
        </h5>
        
        {error && <div className="alert alert-danger">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="name" className="form-label">Company Name</label>
            <input
              type="text"
              className="form-control"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          
          {isEdit && (
            <div className="mb-3 form-check">
              <input
                type="checkbox"
                className="form-check-input"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={loading}
              />
              <label className="form-check-label" htmlFor="isActive">
                Active
              </label>
            </div>
          )}
          
          <div className="d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => router.push('/companies')}
              disabled={loading}
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
                'Save'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanyForm;