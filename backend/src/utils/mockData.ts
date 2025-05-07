// Mock data for testing

/**
 * Mock project data
 */
export const mockProjects = [
  {
    id: '99e05a16-f4af-4ceb-9f21-3929cbb4bfca',
    name: 'Lista de espera',
    description: 'Campanha de marketing para o verão de 2025',
    status: 'ativo',
    campaign_start_date: '2025-06-15',
    campaign_end_date: '2025-09-15',
    start_date: '2025-06-15',
    end_date: '2025-09-15',
    is_active: true,
    created_at: '2025-04-01T12:00:00Z',
    updated_at: '2025-04-01T12:00:00Z',
    company_id: '11b6eb9a-05de-4d96-8afd-621c0b91f23a',
    created_by: 'f75e0c3d-78a4-4b68-b5ff-d9e2a0b38584'
  },
  {
    id: '88f14a25-e3af-4def-8e22-2818baa5cfdb',
    name: 'Black Friday',
    description: 'Campanha para Black Friday 2025',
    status: 'planejamento',
    campaign_start_date: '2025-11-20',
    campaign_end_date: '2025-11-29',
    start_date: '2025-11-20',
    end_date: '2025-11-29',
    is_active: true,
    created_at: '2025-04-02T14:30:00Z',
    updated_at: '2025-04-02T14:30:00Z',
    company_id: '11b6eb9a-05de-4d96-8afd-621c0b91f23a',
    created_by: 'f75e0c3d-78a4-4b68-b5ff-d9e2a0b38584'
  }
];

/**
 * Get a project by ID
 */
export function getProjectById(id: string) {
  return mockProjects.find(project => project.id === id);
}