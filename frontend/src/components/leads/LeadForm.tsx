import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Lead, Project } from '../../interfaces';
import leadsApi from '../../api/leads';
import companiesApi from '../../api/companies';

interface LeadFormProps {
  lead?: Lead;
  isEdit?: boolean;
  projectId?: string;
}

const LeadForm: React.FC<LeadFormProps> = ({ lead, isEdit = false, projectId }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    first_name: string;
    email: string;
    phone: string;
    status: string;
    notes: string;
    project_id: string;
  }>({
    name: lead?.name || '',
    first_name: lead?.first_name || '',
    email: lead?.email || '',
    phone: lead?.phone || '',
    status: lead?.status || 'novo',
    notes: lead?.notes || '',
    project_id: projectId || '',
  });

  // Fetch available projects when component mounts
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await companiesApi.getProjects();
        if (response.success && response.data?.projects) {
          setProjects(response.data.projects.filter(p => p.is_active));
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError('Unable to load projects. Please try again later.');
      }
    };

    fetchProjects();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isEdit && lead?.id) {
        // Update existing lead
        const response = await leadsApi.updateLeadStatus(lead.id, {
          status: formData.status as any,
          notes: formData.notes
        });

        if (response.success) {
          setSuccess('Lead updated successfully');
          // Redirect after a short delay
          setTimeout(() => {
            router.push(`/leads/${lead.id}`);
          }, 1500);
        } else {
          setError(response.error || 'Failed to update lead');
        }
      } else {
        // Create new lead
        const response = await leadsApi.captureLead({
          name: formData.name,
          first_name: formData.first_name,
          email: formData.email,
          phone: formData.phone,
          project_id: formData.project_id,
          notes: formData.notes
        });

        if (response.success) {
          setSuccess('Lead created successfully');
          // Reset the form if not redirecting
          setFormData({
            name: '',
            first_name: '',
            email: '',
            phone: '',
            status: 'novo',
            notes: '',
            project_id: projectId || '',
          });
          // Redirect after a short delay
          setTimeout(() => {
            router.push('/leads');
          }, 1500);
        } else {
          setError(response.error || 'Failed to create lead');
        }
      }
    } catch (err) {
      console.error('Error submitting lead:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h5 className="card-title">{isEdit ? 'Edit Lead' : 'Create New Lead'}</h5>
      </div>
      <div className="card-body">
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="name" className="form-label">Full Name</label>
            <input
              type="text"
              className="form-control"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
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

          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="phone" className="form-label">Phone</label>
            <input
              type="tel"
              className="form-control"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          {isEdit && (
            <div className="mb-3">
              <label htmlFor="status" className="form-label">Status</label>
              <select
                className="form-select"
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
              >
                <option value="novo">New</option>
                <option value="qualificado">Qualified</option>
                <option value="contatado">Contacted</option>
                <option value="convertido">Converted</option>
                <option value="desistiu">Gave Up</option>
                <option value="inativo">Inactive</option>
              </select>
            </div>
          )}

          {!isEdit && (
            <div className="mb-3">
              <label htmlFor="project_id" className="form-label">Project</label>
              <select
                className="form-select"
                id="project_id"
                name="project_id"
                value={formData.project_id}
                onChange={handleChange}
                required
                disabled={!!projectId}
              >
                <option value="">Select a project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mb-3">
            <label htmlFor="notes" className="form-label">Notes</label>
            <textarea
              className="form-control"
              id="notes"
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleChange}
            ></textarea>
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
                isEdit ? 'Update Lead' : 'Create Lead'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeadForm;