import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Lead } from '../../interfaces';
import leadsApi from '../../api/leads';
import { useRealtime } from '../../contexts/RealtimeContext';

interface LeadsListProps {
  projectId?: string;
}

const LeadsList: React.FC<LeadsListProps> = ({ projectId }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get realtime context
  const { isConnected, subscribeToLeads, unsubscribeFromLeads } = useRealtime();
  
  // Track if we have real-time updates enabled
  const [hasRealTimeUpdates, setHasRealTimeUpdates] = useState(false);

  // Initial data fetch
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true);
        const response = await leadsApi.getLeads(projectId ? { project_id: projectId } : undefined);
        
        if (response.success && response.data?.leads) {
          setLeads(response.data.leads);
        } else {
          setError(response.error || 'Failed to fetch leads');
        }
      } catch (err) {
        console.error('Error fetching leads:', err);
        setError('An error occurred while fetching leads');
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, [projectId]);
  
  // Set up real-time updates when connection is established
  useEffect(() => {
    if (isConnected && !hasRealTimeUpdates) {
      // Handler for lead events
      const handleLeadEvent = (data: any) => {
        // For project-specific lists, only process events for this project
        if (projectId && data.new && data.new.project_id !== projectId) {
          return;
        }
        
        if (data.new) {
          const newLead = data.new as Lead;
          
          // Handle INSERT
          if (data.event === 'INSERT') {
            setLeads(prev => {
              // Check if we already have this lead (to avoid duplicates)
              const exists = prev.some(l => l.id === newLead.id);
              if (exists) return prev;
              
              return [...prev, newLead];
            });
          }
          
          // Handle UPDATE
          else if (data.event === 'UPDATE') {
            setLeads(prev => prev.map(l => l.id === newLead.id ? newLead : l));
          }
        }
        // Handle DELETE
        else if (data.event === 'DELETE' && data.old) {
          const oldLead = data.old as Lead;
          if (projectId && oldLead.project_id !== projectId) {
            return;
          }
          setLeads(prev => prev.filter(l => l.id !== oldLead.id));
        }
      };
      
      // Subscribe to all lead events
      subscribeToLeads(handleLeadEvent);
      setHasRealTimeUpdates(true);
      
      // Cleanup when component unmounts
      return () => {
        unsubscribeFromLeads(handleLeadEvent);
      };
    }
  }, [isConnected, hasRealTimeUpdates, projectId, subscribeToLeads, unsubscribeFromLeads]);

  const handleStatusUpdate = async (id: string, status: Lead['status']) => {
    try {
      const response = await leadsApi.updateLeadStatus(id, { status });
      
      if (response.success) {
        // With real-time updates, the state will be updated automatically
        // But we'll also update it directly for immediate feedback
        if (!hasRealTimeUpdates) {
          setLeads(leads.map(lead => 
            lead.id === id ? { ...lead, status } : lead
          ));
        }
      } else {
        setError(response.error || 'Failed to update lead status');
      }
    } catch (err) {
      console.error('Error updating lead status:', err);
      setError('An error occurred while updating the lead status');
    }
  };

  if (loading) {
    return <div className="text-center py-5"><div className="spinner-border"></div></div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  if (leads.length === 0) {
    return (
      <div className="text-center py-5">
        <p className="mb-4">No leads found</p>
        <Link href="/leads/new" className="btn btn-primary">
          Add New Lead
        </Link>
      </div>
    );
  }
  
  // Sort leads by creation date (newest first)
  const sortedLeads = [...leads].sort((a, b) => {
    if (!a.created_at) return 1;
    if (!b.created_at) return -1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Helper function to get badge color based on status
  const getStatusBadgeColor = (status: Lead['status']) => {
    switch (status) {
      case 'novo': return 'bg-info';
      case 'qualificado': return 'bg-primary';
      case 'contatado': return 'bg-warning';
      case 'convertido': return 'bg-success';
      case 'desistiu': return 'bg-danger';
      case 'inativo': return 'bg-secondary';
      default: return 'bg-light';
    }
  };

  // Helper function to get status display name
  const getStatusDisplayName = (status: Lead['status']) => {
    switch (status) {
      case 'novo': return 'New';
      case 'qualificado': return 'Qualified';
      case 'contatado': return 'Contacted';
      case 'convertido': return 'Converted';
      case 'desistiu': return 'Gave Up';
      case 'inativo': return 'Inactive';
      default: return status;
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          Leads
          {isConnected && hasRealTimeUpdates && (
            <span className="badge bg-success ms-2" style={{ fontSize: '0.5em', verticalAlign: 'middle' }}>
              <i className="bi bi-lightning-fill me-1"></i>
              Live
            </span>
          )}
        </h2>
        <Link href="/leads/new" className="btn btn-primary">
          Add Lead
        </Link>
      </div>
      
      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Created</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedLeads.map((lead) => (
              <tr key={lead.id}>
                <td>
                  <Link href={`/leads/${lead.id}`}>
                    {lead.name}
                  </Link>
                </td>
                <td>{lead.email}</td>
                <td>{lead.phone}</td>
                <td>
                  <div className="dropdown">
                    <span 
                      className={`badge ${getStatusBadgeColor(lead.status)} dropdown-toggle`}
                      role="button"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      {getStatusDisplayName(lead.status)}
                    </span>
                    <ul className="dropdown-menu">
                      <li><button 
                        className="dropdown-item" 
                        onClick={() => lead.id && handleStatusUpdate(lead.id, 'novo')}
                      >New</button></li>
                      <li><button 
                        className="dropdown-item" 
                        onClick={() => lead.id && handleStatusUpdate(lead.id, 'qualificado')}
                      >Qualified</button></li>
                      <li><button 
                        className="dropdown-item" 
                        onClick={() => lead.id && handleStatusUpdate(lead.id, 'contatado')}
                      >Contacted</button></li>
                      <li><button 
                        className="dropdown-item" 
                        onClick={() => lead.id && handleStatusUpdate(lead.id, 'convertido')}
                      >Converted</button></li>
                      <li><hr className="dropdown-divider" /></li>
                      <li><button 
                        className="dropdown-item" 
                        onClick={() => lead.id && handleStatusUpdate(lead.id, 'desistiu')}
                      >Gave Up</button></li>
                      <li><button 
                        className="dropdown-item" 
                        onClick={() => lead.id && handleStatusUpdate(lead.id, 'inativo')}
                      >Inactive</button></li>
                    </ul>
                  </div>
                </td>
                <td>
                  {lead.created_at
                    ? new Date(lead.created_at).toLocaleDateString()
                    : 'N/A'}
                </td>
                <td className="text-end">
                  <div className="btn-group">
                    <Link
                      href={`/leads/${lead.id}/edit`}
                      className="btn btn-sm btn-outline-primary"
                    >
                      Edit
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeadsList;