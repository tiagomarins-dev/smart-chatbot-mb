import { getCompanies, getCompanyById, createCompany } from '../../controllers/companiesController';
import * as dbUtils from '../../utils/dbUtils';
import { Company } from '../../interfaces';

// Mock the dbUtils functions
jest.mock('../../utils/dbUtils', () => ({
  executeQuery: jest.fn(),
  insertData: jest.fn(),
  updateData: jest.fn(),
  deleteData: jest.fn()
}));

describe('Companies Controller', () => {
  let mockReq: any;
  let mockRes: any;
  
  beforeEach(() => {
    mockReq = {
      user: { id: 'test-user-id' },
      params: {},
      query: {},
      body: {}
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('getCompanies', () => {
    it('should return all companies for a user', async () => {
      const mockCompanies: Company[] = [
        { 
          id: 'company-1', 
          user_id: 'test-user-id', 
          name: 'Company 1', 
          is_active: true
        },
        { 
          id: 'company-2', 
          user_id: 'test-user-id', 
          name: 'Company 2', 
          is_active: true
        }
      ];
      
      // Mock the executeQuery function
      (dbUtils.executeQuery as jest.Mock).mockResolvedValueOnce(mockCompanies);
      
      await getCompanies(mockReq, mockRes);
      
      expect(dbUtils.executeQuery).toHaveBeenCalledWith({
        table: 'companies',
        select: '*',
        filters: [{ column: 'user_id', operator: 'eq', value: 'test-user-id' }],
        order: { created_at: 'desc' }
      });
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { companies: mockCompanies },
        statusCode: 200
      });
    });
    
    it('should filter companies by ID if provided', async () => {
      const companyId = 'company-1';
      mockReq.query.id = companyId;
      
      const mockCompany: Company = { 
        id: companyId, 
        user_id: 'test-user-id', 
        name: 'Company 1', 
        is_active: true
      };
      
      // Mock the executeQuery function
      (dbUtils.executeQuery as jest.Mock).mockResolvedValueOnce([mockCompany]);
      
      await getCompanies(mockReq, mockRes);
      
      expect(dbUtils.executeQuery).toHaveBeenCalledWith({
        table: 'companies',
        select: '*',
        filters: [
          { column: 'user_id', operator: 'eq', value: 'test-user-id' },
          { column: 'id', operator: 'eq', value: companyId }
        ],
        order: { created_at: 'desc' }
      });
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { companies: [mockCompany] },
        statusCode: 200
      });
    });
    
    it('should handle database errors', async () => {
      const error = new Error('Database error');
      
      // Mock the executeQuery function to throw an error
      (dbUtils.executeQuery as jest.Mock).mockRejectedValueOnce(error);
      
      await getCompanies(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: expect.stringContaining('Database error'),
        statusCode: 500
      });
    });
  });
  
  describe('getCompanyById', () => {
    it('should return a company by ID', async () => {
      const companyId = 'company-1';
      mockReq.params.id = companyId;
      
      const mockCompany: Company = { 
        id: companyId, 
        user_id: 'test-user-id', 
        name: 'Company 1', 
        is_active: true
      };
      
      // Mock the executeQuery function
      (dbUtils.executeQuery as jest.Mock).mockResolvedValueOnce([mockCompany]);
      
      await getCompanyById(mockReq, mockRes);
      
      expect(dbUtils.executeQuery).toHaveBeenCalledWith({
        table: 'companies',
        select: '*',
        filters: [
          { column: 'id', operator: 'eq', value: companyId },
          { column: 'user_id', operator: 'eq', value: 'test-user-id' }
        ]
      });
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { company: mockCompany },
        statusCode: 200
      });
    });
    
    it('should return 404 if company not found', async () => {
      const companyId = 'non-existent-id';
      mockReq.params.id = companyId;
      
      // Mock the executeQuery function to return empty array
      (dbUtils.executeQuery as jest.Mock).mockResolvedValueOnce([]);
      
      await getCompanyById(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Company not found',
        statusCode: 404
      });
    });
  });
  
  describe('createCompany', () => {
    it('should create a new company', async () => {
      const companyData = { name: 'New Company' };
      mockReq.body = companyData;
      
      const createdCompany: Company = { 
        id: 'new-company-id', 
        user_id: 'test-user-id', 
        name: companyData.name, 
        is_active: true
      };
      
      // Mock the insertData function
      (dbUtils.insertData as jest.Mock).mockResolvedValueOnce(createdCompany);
      
      await createCompany(mockReq, mockRes);
      
      expect(dbUtils.insertData).toHaveBeenCalledWith('companies', {
        user_id: 'test-user-id',
        name: companyData.name,
        is_active: true
      });
      
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { company: createdCompany },
        statusCode: 201
      });
    });
    
    it('should return 400 if name is missing', async () => {
      mockReq.body = {};
      
      await createCompany(mockReq, mockRes);
      
      expect(dbUtils.insertData).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Company name is required',
        statusCode: 400
      });
    });
  });
});