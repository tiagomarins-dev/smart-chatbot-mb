import { Request, Response } from 'express';
import { captureEvent } from '../../controllers/eventCaptureController';
import { createLeadEvent } from '../../services/leadEventsService';
import { executeQuery } from '../../utils/dbUtils';

// Mock das dependências
jest.mock('../../services/leadEventsService', () => ({
  createLeadEvent: jest.fn()
}));

jest.mock('../../utils/dbUtils', () => ({
  executeQuery: jest.fn()
}));

describe('Event Capture Controller', () => {
  // Objetos mock para request e response
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseObject: any = {};

  beforeEach(() => {
    // Resetar todos os mocks antes de cada teste
    jest.clearAllMocks();
    
    // Configurar mocks para request e response
    mockRequest = {
      body: {}
    };
    
    responseObject = {
      statusCode: 0,
      jsonObject: {}
    };
    
    mockResponse = {
      status: jest.fn().mockImplementation((code) => {
        responseObject.statusCode = code;
        return mockResponse;
      }),
      json: jest.fn().mockImplementation((data) => {
        responseObject.jsonObject = data;
        return mockResponse;
      })
    };
  });

  it('should return 400 when event_type is missing', async () => {
    // Configurar o request mock
    mockRequest.body = {
      phone: '1234567890',
      email: 'test@example.com'
    };
    
    // Executar a função
    await captureEvent(mockRequest as Request, mockResponse as Response);
    
    // Verificar a resposta
    expect(responseObject.statusCode).toBe(400);
    expect(responseObject.jsonObject.error).toBeTruthy();
  });

  it('should return 400 when both phone and email are missing', async () => {
    // Configurar o request mock
    mockRequest.body = {
      event_type: 'test_event'
    };
    
    // Executar a função
    await captureEvent(mockRequest as Request, mockResponse as Response);
    
    // Verificar a resposta
    expect(responseObject.statusCode).toBe(400);
    expect(responseObject.jsonObject.error).toBeTruthy();
  });

  it('should return 404 when no lead is found', async () => {
    // Configurar o request mock
    mockRequest.body = {
      phone: '1234567890',
      event_type: 'test_event'
    };
    
    // Mock do executeQuery para retornar nenhum resultado
    (executeQuery as jest.Mock).mockResolvedValue([]);
    
    // Executar a função
    await captureEvent(mockRequest as Request, mockResponse as Response);
    
    // Verificar a resposta
    expect(responseObject.statusCode).toBe(404);
    expect(responseObject.jsonObject.error).toBeTruthy();
  });

  it('should find lead by phone and create event successfully', async () => {
    // Configurar o request mock
    mockRequest.body = {
      phone: '1234567890',
      event_type: 'test_event',
      event_text: 'Test message',
      origin: 'test'
    };
    
    // Mock do executeQuery para retornar um lead
    (executeQuery as jest.Mock).mockResolvedValue([{ id: 'lead-123' }]);
    
    // Mock do createLeadEvent para retornar um evento
    (createLeadEvent as jest.Mock).mockResolvedValue({ 
      id: 'event-123', 
      lead_id: 'lead-123',
      event_type: 'test_event'
    });
    
    // Executar a função
    await captureEvent(mockRequest as Request, mockResponse as Response);
    
    // Verificar se a criação do evento foi chamada com os parâmetros corretos
    expect(createLeadEvent).toHaveBeenCalledWith(
      'lead-123',
      'test_event',
      { text: 'Test message' },
      'test'
    );
    
    // Verificar a resposta
    expect(responseObject.statusCode).toBe(200);
    expect(responseObject.jsonObject.success).toBe(true);
    expect(responseObject.jsonObject.data.lead_id).toBe('lead-123');
  });

  it('should find lead by email when phone lookup fails', async () => {
    // Configurar o request mock
    mockRequest.body = {
      phone: '1234567890',
      email: 'test@example.com',
      event_type: 'test_event'
    };
    
    // Mock do executeQuery para retornar nenhum resultado para telefone
    // mas um resultado para email
    (executeQuery as jest.Mock)
      .mockResolvedValueOnce([]) // Primeira chamada (telefone) retorna vazio
      .mockResolvedValueOnce([{ id: 'lead-123' }]); // Segunda chamada (email) retorna um lead
    
    // Mock do createLeadEvent para retornar um evento
    (createLeadEvent as jest.Mock).mockResolvedValue({ 
      id: 'event-123', 
      lead_id: 'lead-123',
      event_type: 'test_event'
    });
    
    // Executar a função
    await captureEvent(mockRequest as Request, mockResponse as Response);
    
    // Verificar se a criação do evento foi chamada com os parâmetros corretos
    expect(createLeadEvent).toHaveBeenCalledWith(
      'lead-123',
      'test_event',
      { text: '' },
      undefined
    );
    
    // Verificar a resposta
    expect(responseObject.statusCode).toBe(200);
    expect(responseObject.jsonObject.success).toBe(true);
  });
});