import React, { useState, useEffect } from 'react';
import { LeadStats } from '../../interfaces';
import leadsApi from '../../api/leads';
import { useRealtime } from '../../contexts/RealtimeContext';

interface LeadsDashboardProps {
  projectId?: string;
  period?: number;
}

const LeadsDashboard: React.FC<LeadsDashboardProps> = ({ projectId, period = 30 }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<LeadStats | null>(null);
  
  // Get realtime context
  const { isConnected, subscribeToLeads, unsubscribeFromLeads, leadStats, updateLeadStats } = useRealtime();
  
  // Track if we have real-time updates enabled
  const [hasRealTimeUpdates, setHasRealTimeUpdates] = useState(false);

  // Initial data fetch
  useEffect(() => {
    const fetchLeadStats = async () => {
      try {
        setLoading(true);
        const response = await leadsApi.getLeadStats({ 
          project_id: projectId,
          period 
        });
        
        if (response.success && response.data?.stats) {
          setStats(response.data.stats);
          // Update the stats in the realtime context
          updateLeadStats(response.data.stats);
        } else {
          setError(response.error || 'Failed to fetch lead statistics');
        }
      } catch (err) {
        console.error('Error fetching lead statistics:', err);
        setError('An error occurred while fetching lead statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchLeadStats();
  }, [projectId, period, updateLeadStats]);
  
  // Use stats from realtime context when available
  useEffect(() => {
    if (leadStats) {
      setStats(leadStats);
    }
  }, [leadStats]);

  // Set up real-time updates for lead stats
  useEffect(() => {
    if (isConnected && !hasRealTimeUpdates) {
      // Handler for lead events to update stats
      const handleLeadEvent = (data: any) => {
        // Skip if we don't have stats yet
        if (!stats) return;
        
        // If we have project filtering, ensure we only process events for this project
        if (projectId && data.new?.project_id !== projectId && data.old?.project_id !== projectId) {
          return;
        }
        
        // We'll let the RealtimeContext handle the detailed stats updates
        // It will update the leadStats which we'll pick up in the effect hook above
      };
      
      // Subscribe to lead events
      subscribeToLeads(handleLeadEvent);
      setHasRealTimeUpdates(true);
      
      // Cleanup when component unmounts
      return () => {
        unsubscribeFromLeads(handleLeadEvent);
      };
    }
  }, [isConnected, hasRealTimeUpdates, projectId, stats, subscribeToLeads, unsubscribeFromLeads]);

  if (loading) {
    return <div className="text-center py-5"><div className="spinner-border"></div></div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  if (!stats) {
    return <div className="alert alert-info">No lead statistics available</div>;
  }

  // Helper function to get percentage color
  const getPercentageColor = (percentage: number) => {
    if (percentage >= 70) return 'text-success';
    if (percentage >= 40) return 'text-warning';
    return 'text-danger';
  };

  return (
    <div className="mb-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          Lead Statistics
          {isConnected && hasRealTimeUpdates && (
            <span className="badge bg-success ms-2" style={{ fontSize: '0.5em', verticalAlign: 'middle' }}>
              <i className="bi bi-lightning-fill me-1"></i>
              Live
            </span>
          )}
        </h2>
        <div className="dropdown">
          <button className="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
            Last {period} days
          </button>
          <ul className="dropdown-menu">
            <li><a className="dropdown-item" href={`?period=7${projectId ? `&project_id=${projectId}` : ''}`}>Last 7 days</a></li>
            <li><a className="dropdown-item" href={`?period=30${projectId ? `&project_id=${projectId}` : ''}`}>Last 30 days</a></li>
            <li><a className="dropdown-item" href={`?period=90${projectId ? `&project_id=${projectId}` : ''}`}>Last 90 days</a></li>
          </ul>
        </div>
      </div>

      <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4 mb-4">
        {/* Total Leads Card */}
        <div className="col">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title text-muted">Total Leads</h5>
              <h2 className="card-text">{stats.total_leads}</h2>
              <p className="card-text text-muted">
                <span className="text-success">+{stats.new_leads_period}</span> in the last {period} days
              </p>
            </div>
          </div>
        </div>

        {/* Conversion Rate Card */}
        <div className="col">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title text-muted">Conversion Rate</h5>
              <h2 className={`card-text ${getPercentageColor(stats.conversion_rate)}`}>
                {stats.conversion_rate.toFixed(1)}%
              </h2>
              <p className="card-text text-muted">
                From new to converted
              </p>
            </div>
          </div>
        </div>

        {/* Leads by Status */}
        <div className="col">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title text-muted">Status Breakdown</h5>
              <div className="d-flex flex-column gap-2">
                <div className="d-flex justify-content-between">
                  <span>New</span>
                  <span className="badge bg-info">{stats.leads_by_status.novo || 0}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Qualified</span>
                  <span className="badge bg-primary">{stats.leads_by_status.qualificado || 0}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Contacted</span>
                  <span className="badge bg-warning">{stats.leads_by_status.contatado || 0}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Converted</span>
                  <span className="badge bg-success">{stats.leads_by_status.convertido || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Inactive Leads */}
        <div className="col">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title text-muted">Inactive Leads</h5>
              <div className="d-flex flex-column gap-2">
                <div className="d-flex justify-content-between">
                  <span>Gave Up</span>
                  <span className="badge bg-danger">{stats.leads_by_status.desistiu || 0}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Inactive</span>
                  <span className="badge bg-secondary">{stats.leads_by_status.inativo || 0}</span>
                </div>
                <div className="mt-2">
                  <small className="text-muted">
                    {((stats.leads_by_status.desistiu || 0) + (stats.leads_by_status.inativo || 0)) / stats.total_leads * 100}% of total leads
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="card-title">Lead Trend</h5>
        </div>
        <div className="card-body">
          <div className="chart-container" style={{ height: '300px' }}>
            {/* We would use a chart library here like Chart.js or Recharts */}
            <div className="text-center py-5">
              <p className="text-muted">Chart visualization would be implemented here</p>
              <p className="small text-muted">
                Total leads for the period: {stats.leads_by_day.reduce((sum, day) => sum + day.count, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Source Distribution */}
      <div className="row">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title">Leads by Source</h5>
            </div>
            <div className="card-body">
              <ul className="list-group list-group-flush">
                {Object.entries(stats.leads_by_source)
                  .sort(([, countA], [, countB]) => countB - countA)
                  .map(([source, count]) => (
                    <li key={source} className="list-group-item d-flex justify-content-between align-items-center">
                      {source || 'Direct'}
                      <span className="badge bg-primary rounded-pill">{count}</span>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadsDashboard;