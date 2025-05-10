import { client } from './client';

/**
 * API client for automated messages functionality
 */
export const automatedMessagesApi = {
  /**
   * Get all message templates for a project
   */
  getTemplates: async (projectId: string) => {
    return client.get(`/projects/${projectId}/templates`);
  },

  /**
   * Get a specific message template
   */
  getTemplate: async (templateId: string) => {
    return client.get(`/templates/${templateId}`);
  },

  /**
   * Create a new message template
   */
  createTemplate: async (projectId: string, templateData: any) => {
    return client.post(`/projects/${projectId}/templates`, templateData);
  },

  /**
   * Update an existing message template
   */
  updateTemplate: async (templateId: string, templateData: any) => {
    return client.put(`/templates/${templateId}`, templateData);
  },

  /**
   * Delete a message template
   */
  deleteTemplate: async (templateId: string) => {
    return client.delete(`/templates/${templateId}`);
  },

  /**
   * Get all event triggers for a project
   */
  getEventTriggers: async (projectId: string) => {
    return client.get(`/projects/${projectId}/events`);
  },

  /**
   * Create a new event trigger
   */
  createEventTrigger: async (projectId: string, eventData: any) => {
    return client.post(`/projects/${projectId}/events`, eventData);
  },

  /**
   * Update an existing event trigger
   */
  updateEventTrigger: async (eventId: string, eventData: any) => {
    return client.put(`/events/${eventId}`, eventData);
  },

  /**
   * Delete an event trigger
   */
  deleteEventTrigger: async (eventId: string) => {
    return client.delete(`/events/${eventId}`);
  },

  /**
   * Get automated message history for a lead
   */
  getLeadMessageHistory: async (leadId: string) => {
    return client.get(`/leads/${leadId}/messages`);
  }
};

export default automatedMessagesApi;