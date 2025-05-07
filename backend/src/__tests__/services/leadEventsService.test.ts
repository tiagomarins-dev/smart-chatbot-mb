import { createLeadEvent, getLeadEvents, getLeadEventsByType, getLeadEventsByOrigin } from '../../services/leadEventsService';
import { executeQuery, insertData } from '../../utils/dbUtils';

// Mock das dependências
jest.mock('../../utils/dbUtils', () => ({
  executeQuery: jest.fn(),
  insertData: jest.fn()
}));

describe('Lead Events Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createLeadEvent', () => {
    it('should create a lead event successfully', async () => {
      // Mocks
      const mockEvent = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        lead_id: 'abc-123',
        event_type: 'whatsapp_message',
        event_data: { message: 'Hello' },
        origin: 'whatsapp'
      };
      
      (insertData as jest.Mock).mockResolvedValue(mockEvent);
      
      // Teste
      const result = await createLeadEvent(
        'abc-123',
        'whatsapp_message',
        { message: 'Hello' },
        'whatsapp'
      );
      
      // Verificações
      expect(insertData).toHaveBeenCalledWith('lead_events', {
        lead_id: 'abc-123',
        event_type: 'whatsapp_message',
        event_data: { message: 'Hello' },
        origin: 'whatsapp'
      });
      
      expect(result).toEqual(mockEvent);
    });
    
    it('should handle errors when creating an event', async () => {
      // Mocks
      (insertData as jest.Mock).mockRejectedValue(new Error('Database error'));
      
      // Spy on console.error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Teste
      const result = await createLeadEvent(
        'abc-123',
        'whatsapp_message',
        { message: 'Hello' }
      );
      
      // Verificações
      expect(consoleSpy).toHaveBeenCalled();
      expect(result).toBeNull();
      
      // Restaurar spy
      consoleSpy.mockRestore();
    });
  });
  
  describe('getLeadEvents', () => {
    it('should retrieve lead events successfully', async () => {
      // Mocks
      const mockEvents = [
        {
          id: '123',
          lead_id: 'abc-123',
          event_type: 'whatsapp_message',
          event_data: { message: 'Hello' },
          origin: 'whatsapp',
          created_at: '2023-06-01T12:00:00Z'
        }
      ];
      
      (executeQuery as jest.Mock).mockResolvedValue(mockEvents);
      
      // Teste
      const result = await getLeadEvents('abc-123');
      
      // Verificações
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM lead_events'),
        ['abc-123']
      );
      
      expect(result).toEqual(mockEvents);
    });
    
    it('should handle errors when retrieving events', async () => {
      // Mocks
      (executeQuery as jest.Mock).mockRejectedValue(new Error('Database error'));
      
      // Spy on console.error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Teste
      const result = await getLeadEvents('abc-123');
      
      // Verificações
      expect(consoleSpy).toHaveBeenCalled();
      expect(result).toEqual([]);
      
      // Restaurar spy
      consoleSpy.mockRestore();
    });
  });
  
  describe('getLeadEventsByType', () => {
    it('should retrieve lead events by type successfully', async () => {
      // Mocks
      const mockEvents = [
        {
          id: '123',
          lead_id: 'abc-123',
          event_type: 'whatsapp_message',
          event_data: { message: 'Hello' },
          origin: 'whatsapp',
          created_at: '2023-06-01T12:00:00Z'
        }
      ];
      
      (executeQuery as jest.Mock).mockResolvedValue(mockEvents);
      
      // Teste
      const result = await getLeadEventsByType('abc-123', 'whatsapp_message');
      
      // Verificações
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM lead_events'),
        ['abc-123', 'whatsapp_message']
      );
      
      expect(result).toEqual(mockEvents);
    });
  });
  
  describe('getLeadEventsByOrigin', () => {
    it('should retrieve lead events by origin successfully', async () => {
      // Mocks
      const mockEvents = [
        {
          id: '123',
          lead_id: 'abc-123',
          event_type: 'whatsapp_message',
          event_data: { message: 'Hello' },
          origin: 'whatsapp',
          created_at: '2023-06-01T12:00:00Z'
        }
      ];
      
      (executeQuery as jest.Mock).mockResolvedValue(mockEvents);
      
      // Teste
      const result = await getLeadEventsByOrigin('abc-123', 'whatsapp');
      
      // Verificações
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM lead_events'),
        ['abc-123', 'whatsapp']
      );
      
      expect(result).toEqual(mockEvents);
    });
  });
});