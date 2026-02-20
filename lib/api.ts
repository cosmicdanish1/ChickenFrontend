/**
 * API Client for Poultry Management System
 * Connects to NestJS Backend at http://localhost:3001/api/v1
 */

// Base URL configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// TypeScript Interfaces
export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface Vehicle {
  id: string;
  vehicleNumber: string;
  vehicleType: string;
  driverName: string;
  phone: string;
  ownerName?: string;
  address?: string;
  totalCapacity?: number;
  petrolTankCapacity?: number;
  mileage?: number;
  joinDate: string;
  status: 'active' | 'inactive';
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Farmer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Retailer {
  id: string;
  name: string;
  ownerName?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  status?: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface PurchaseOrderItem {
  id?: string;
  description: string;
  quantity: number;
  unit: string;
  unitCost: number;
  lineTotal?: number;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierName: string;
  orderDate: string;
  dueDate?: string;
  status: 'pending' | 'received' | 'cancelled';
  totalAmount: number;
  notes?: string;
  items: PurchaseOrderItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  customerName: string;
  saleDate: string;
  productType: 'eggs' | 'meat' | 'chicks' | 'other';
  quantity: number;
  unit?: string;
  unitPrice: number;
  totalAmount: number;
  paymentStatus: 'paid' | 'pending' | 'partial';
  amountReceived: number;
  notes?: string;
  retailerId?: string;
  retailer?: Retailer;
  createdAt?: string;
  updatedAt?: string;
}

export interface Expense {
  id: string;
  expenseDate: string;
  category: 'feed' | 'labor' | 'medicine' | 'utilities' | 'equipment' | 'maintenance' | 'transportation' | 'other';
  description: string;
  amount: number;
  paymentMethod: 'cash' | 'bank_transfer' | 'check' | 'credit_card';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DashboardKPIs {
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  totalVehicles: number;
  totalSales: number;
  period: {
    startDate: string;
    endDate: string;
  };
}

export interface InventoryItem {
  id: string;
  itemType: string;
  itemName: string;
  quantity: number;
  unit: string;
  minimumStockLevel: number;
  currentStockLevel: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  lastUpdated?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'staff';
  status: 'active' | 'inactive';
  joinDate: string;
  lastLogin?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserStatistics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  adminUsers: number;
  managerUsers: number;
  staffUsers: number;
}

export interface Setting {
  id: string;
  key: string;
  value: string;
  category?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppSettings {
  currency: string;
  theme: string;
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
}

// Auth utilities
let authToken: string | null = null;

export function setAuthToken(token: string) {
  authToken = token;
  if (typeof window !== 'undefined') {
    localStorage.setItem('authToken', token);
  }
}

export function getAuthToken(): string | null {
  if (authToken) return authToken;
  if (typeof window !== 'undefined') {
    authToken = localStorage.getItem('authToken');
  }
  return authToken;
}

export function clearAuthToken() {
  authToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
  }
}

// HTTP client with auth
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      if (response.status === 401) {
        clearAuthToken();
        throw new Error('Authentication required');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    // Handle empty responses (like DELETE operations)
    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');
    
    // If no content or content-length is 0, return empty object
    if (contentLength === '0' || response.status === 204) {
      return {};
    }
    
    // If there's no content-type or it's not JSON, try to parse but handle errors
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      if (!text || text.trim() === '') {
        return {};
      }
      try {
        return JSON.parse(text);
      } catch {
        return {};
      }
    }

    return await response.json();
  } catch (error) {
    console.error(`API request failed: ${endpoint}`, error);
    throw error;
  }
}

// API methods
export const api = {
  // Authentication
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    return response;
  },

  // Health check
  async health(): Promise<{ status: string }> {
    return apiRequest('/health');
  },

  // Vehicles
  async getVehicles(): Promise<Vehicle[]> {
    return apiRequest('/vehicles');
  },

  async getVehicle(id: string): Promise<Vehicle> {
    return apiRequest(`/vehicles/${id}`);
  },

  async createVehicle(vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): Promise<Vehicle> {
    return apiRequest('/vehicles', {
      method: 'POST',
      body: JSON.stringify(vehicle),
    });
  },

  async updateVehicle(id: string, vehicle: Partial<Vehicle>): Promise<Vehicle> {
    return apiRequest(`/vehicles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(vehicle),
    });
  },

  async deleteVehicle(id: string): Promise<void> {
    return apiRequest(`/vehicles/${id}`, {
      method: 'DELETE',
    });
  },

  // Farmers
  async getFarmers(): Promise<Farmer[]> {
    return apiRequest('/farmers');
  },

  async getFarmer(id: string): Promise<Farmer> {
    return apiRequest(`/farmers/${id}`);
  },

  async createFarmer(farmer: Omit<Farmer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Farmer> {
    return apiRequest('/farmers', {
      method: 'POST',
      body: JSON.stringify(farmer),
    });
  },

  async updateFarmer(id: string, farmer: Partial<Farmer>): Promise<Farmer> {
    return apiRequest(`/farmers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(farmer),
    });
  },

  async deleteFarmer(id: string): Promise<void> {
    return apiRequest(`/farmers/${id}`, {
      method: 'DELETE',
    });
  },

  // Retailers
  async getRetailers(): Promise<Retailer[]> {
    return apiRequest('/retailers');
  },

  async getRetailer(id: string): Promise<Retailer> {
    return apiRequest(`/retailers/${id}`);
  },

  async createRetailer(retailer: Omit<Retailer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Retailer> {
    return apiRequest('/retailers', {
      method: 'POST',
      body: JSON.stringify(retailer),
    });
  },

  async updateRetailer(id: string, retailer: Partial<Retailer>): Promise<Retailer> {
    return apiRequest(`/retailers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(retailer),
    });
  },

  async deleteRetailer(id: string): Promise<void> {
    return apiRequest(`/retailers/${id}`, {
      method: 'DELETE',
    });
  },

  // Purchase Orders
  async getPurchaseOrders(params?: {
    startDate?: string;
    endDate?: string;
    supplier?: string;
    status?: string;
  }): Promise<PurchaseOrder[]> {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    if (params?.supplier) searchParams.append('supplier', params.supplier);
    if (params?.status) searchParams.append('status', params.status);
    
    const query = searchParams.toString();
    return apiRequest(`/purchases${query ? `?${query}` : ''}`);
  },

  async getPurchaseOrder(id: string): Promise<PurchaseOrder> {
    return apiRequest(`/purchases/${id}`);
  },

  async createPurchaseOrder(order: Omit<PurchaseOrder, 'id' | 'totalAmount' | 'createdAt' | 'updatedAt'>): Promise<PurchaseOrder> {
    return apiRequest('/purchases', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  },

  async updatePurchaseOrder(id: string, order: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
    return apiRequest(`/purchases/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(order),
    });
  },

  async updatePurchaseOrderStatus(id: string, status: 'pending' | 'received' | 'cancelled'): Promise<PurchaseOrder> {
    return apiRequest(`/purchases/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async deletePurchaseOrder(id: string): Promise<void> {
    return apiRequest(`/purchases/${id}`, {
      method: 'DELETE',
    });
  },

  // Sales
  async getSales(params?: {
    startDate?: string;
    endDate?: string;
    customer?: string;
    productType?: string;
    paymentStatus?: string;
  }): Promise<Sale[]> {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    if (params?.customer) searchParams.append('customer', params.customer);
    if (params?.productType) searchParams.append('productType', params.productType);
    if (params?.paymentStatus) searchParams.append('paymentStatus', params.paymentStatus);
    
    const query = searchParams.toString();
    return apiRequest(`/sales${query ? `?${query}` : ''}`);
  },

  async getSale(id: string): Promise<Sale> {
    return apiRequest(`/sales/${id}`);
  },

  async createSale(sale: Omit<Sale, 'id' | 'totalAmount' | 'createdAt' | 'updatedAt'>): Promise<Sale> {
    return apiRequest('/sales', {
      method: 'POST',
      body: JSON.stringify(sale),
    });
  },

  async updateSale(id: string, sale: Partial<Sale>): Promise<Sale> {
    return apiRequest(`/sales/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(sale),
    });
  },

  async updateSalePaymentStatus(id: string, paymentStatus: 'paid' | 'pending' | 'partial', amountReceived?: number): Promise<Sale> {
    return apiRequest(`/sales/${id}/payment`, {
      method: 'PATCH',
      body: JSON.stringify({ paymentStatus, amountReceived }),
    });
  },

  async deleteSale(id: string): Promise<void> {
    return apiRequest(`/sales/${id}`, {
      method: 'DELETE',
    });
  },

  // Expenses
  async getExpenses(params?: {
    startDate?: string;
    endDate?: string;
    category?: string;
    paymentMethod?: string;
  }): Promise<Expense[]> {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    if (params?.category) searchParams.append('category', params.category);
    if (params?.paymentMethod) searchParams.append('paymentMethod', params.paymentMethod);
    
    const query = searchParams.toString();
    return apiRequest(`/expenses${query ? `?${query}` : ''}`);
  },

  async getExpense(id: string): Promise<Expense> {
    return apiRequest(`/expenses/${id}`);
  },

  async createExpense(expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Promise<Expense> {
    return apiRequest('/expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    });
  },

  async updateExpense(id: string, expense: Partial<Expense>): Promise<Expense> {
    return apiRequest(`/expenses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(expense),
    });
  },

  async deleteExpense(id: string): Promise<void> {
    return apiRequest(`/expenses/${id}`, {
      method: 'DELETE',
    });
  },

  async getExpensesByCategory(startDate?: string, endDate?: string): Promise<Array<{ category: string; amount: number; count: number }>> {
    const searchParams = new URLSearchParams();
    if (startDate) searchParams.append('startDate', startDate);
    if (endDate) searchParams.append('endDate', endDate);
    
    const query = searchParams.toString();
    return apiRequest(`/expenses/by-category${query ? `?${query}` : ''}`);
  },

  async getTotalExpenses(startDate?: string, endDate?: string): Promise<number> {
    const searchParams = new URLSearchParams();
    if (startDate) searchParams.append('startDate', startDate);
    if (endDate) searchParams.append('endDate', endDate);
    
    const query = searchParams.toString();
    return apiRequest(`/expenses/total${query ? `?${query}` : ''}`);
  },

  // Dashboard
  async getDashboardKPIs(startDate?: string, endDate?: string): Promise<DashboardKPIs> {
    const searchParams = new URLSearchParams();
    if (startDate) searchParams.append('startDate', startDate);
    if (endDate) searchParams.append('endDate', endDate);
    
    const query = searchParams.toString();
    return apiRequest(`/dashboard/kpis${query ? `?${query}` : ''}`);
  },

  async getRevenueByProductType(startDate?: string, endDate?: string): Promise<Array<{ productType: string; revenue: number; count: number }>> {
    const searchParams = new URLSearchParams();
    if (startDate) searchParams.append('startDate', startDate);
    if (endDate) searchParams.append('endDate', endDate);
    
    const query = searchParams.toString();
    return apiRequest(`/dashboard/revenue-by-product${query ? `?${query}` : ''}`);
  },

  async getExpensesByCategory2(startDate?: string, endDate?: string): Promise<Array<{ category: string; amount: number; count: number }>> {
    const searchParams = new URLSearchParams();
    if (startDate) searchParams.append('startDate', startDate);
    if (endDate) searchParams.append('endDate', endDate);
    
    const query = searchParams.toString();
    return apiRequest(`/dashboard/expenses-by-category${query ? `?${query}` : ''}`);
  },

  async getRecentSales(limit?: number): Promise<Sale[]> {
    const searchParams = new URLSearchParams();
    if (limit) searchParams.append('limit', limit.toString());
    
    const query = searchParams.toString();
    return apiRequest(`/dashboard/recent-sales${query ? `?${query}` : ''}`);
  },

  async getRecentExpenses(limit?: number): Promise<Expense[]> {
    const searchParams = new URLSearchParams();
    if (limit) searchParams.append('limit', limit.toString());
    
    const query = searchParams.toString();
    return apiRequest(`/dashboard/recent-expenses${query ? `?${query}` : ''}`);
  },

  // Inventory
  async getInventoryItems(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<InventoryItem[]> {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    
    const query = searchParams.toString();
    return apiRequest(`/inventory${query ? `?${query}` : ''}`);
  },

  async getInventoryItem(id: string): Promise<InventoryItem> {
    return apiRequest(`/inventory/${id}`);
  },

  async createInventoryItem(item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt' | 'lastUpdated'>): Promise<InventoryItem> {
    return apiRequest('/inventory', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },

  async updateInventoryItem(id: string, item: Partial<InventoryItem>): Promise<InventoryItem> {
    return apiRequest(`/inventory/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(item),
    });
  },

  async deleteInventoryItem(id: string): Promise<void> {
    return apiRequest(`/inventory/${id}`, {
      method: 'DELETE',
    });
  },

  async getLowStockItems(): Promise<InventoryItem[]> {
    return apiRequest('/inventory/low-stock');
  },

  async getTotalInventoryValue(): Promise<number> {
    return apiRequest('/inventory/total-value');
  },

  async getInventoryByType(): Promise<Array<{ itemType: string; count: number; totalQuantity: number }>> {
    return apiRequest('/inventory/by-type');
  },

  // Advanced Dashboard Analytics
  async getMonthlyRevenueVsExpenses(months?: number): Promise<Array<{
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }>> {
    const searchParams = new URLSearchParams();
    if (months) searchParams.append('months', months.toString());
    
    const query = searchParams.toString();
    return apiRequest(`/dashboard/monthly-revenue-vs-expenses${query ? `?${query}` : ''}`);
  },

  async getMonthlyProfitTrends(months?: number): Promise<Array<{
    month: string;
    profit: number;
    profitMargin: string;
  }>> {
    const searchParams = new URLSearchParams();
    if (months) searchParams.append('months', months.toString());
    
    const query = searchParams.toString();
    return apiRequest(`/dashboard/monthly-profit-trends${query ? `?${query}` : ''}`);
  },

  async getFinancialSummary(months?: number): Promise<{
    totalRevenue: number;
    totalExpenses: number;
    totalProfit: number;
    avgMonthlyProfit: number;
    roi: number;
    revenuePerMonth: number;
    expensePerMonth: number;
    profitMargin: string;
    period: {
      startDate: string;
      endDate: string;
      months: number;
    };
  }> {
    const searchParams = new URLSearchParams();
    if (months) searchParams.append('months', months.toString());
    
    const query = searchParams.toString();
    return apiRequest(`/dashboard/financial-summary${query ? `?${query}` : ''}`);
  },

  async getSalesPerformance(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<Array<{
    productType: string;
    revenue: number;
    quantity: number;
    salesCount: number;
    avgPrice: number;
  }>> {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    
    const query = searchParams.toString();
    return apiRequest(`/dashboard/sales-performance${query ? `?${query}` : ''}`);
  },

  async getTopExpenseCategories(params?: {
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<Array<{
    category: string;
    amount: number;
    count: number;
  }>> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    
    const query = searchParams.toString();
    return apiRequest(`/dashboard/top-expense-categories${query ? `?${query}` : ''}`);
  },

  async getInventorySummary(): Promise<{
    totalItems: number;
    lowStockItems: number;
    totalValue: number;
    byType: Array<{
      itemType: string;
      count: number;
    }>;
  }> {
    return apiRequest('/dashboard/inventory-summary');
  },

  async getPurchasesSummary(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{
    totalOrders: number;
    pendingOrders: number;
    totalValue: number;
    period: {
      startDate: string;
      endDate: string;
    };
  }> {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    
    const query = searchParams.toString();
    return apiRequest(`/dashboard/purchases-summary${query ? `?${query}` : ''}`);
  },

  async getComprehensiveDashboard(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<any> {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    
    const query = searchParams.toString();
    return apiRequest(`/dashboard/comprehensive${query ? `?${query}` : ''}`);
  },

  // Users Management
  async getUsers(): Promise<User[]> {
    return apiRequest('/users');
  },

  async getUser(id: string): Promise<User> {
    return apiRequest(`/users/${id}`);
  },

  async createUser(user: Omit<User, 'id' | 'joinDate' | 'lastLogin' | 'createdAt' | 'updatedAt'> & { password: string }): Promise<User> {
    return apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  },

  async updateUser(id: string, user: Partial<User> & { password?: string }): Promise<User> {
    return apiRequest(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(user),
    });
  },

  async activateUser(id: string): Promise<User> {
    return apiRequest(`/users/${id}/activate`, {
      method: 'PATCH',
    });
  },

  async deactivateUser(id: string): Promise<User> {
    return apiRequest(`/users/${id}/deactivate`, {
      method: 'PATCH',
    });
  },

  async getUserStatistics(): Promise<UserStatistics> {
    return apiRequest('/users/statistics/summary');
  },

  // Settings Management
  async getSettings(): Promise<Setting[]> {
    return apiRequest('/settings');
  },

  async getSetting(id: string): Promise<Setting> {
    return apiRequest(`/settings/${id}`);
  },

  async getSettingByKey(key: string): Promise<Setting | null> {
    return apiRequest(`/settings/key/${key}`);
  },

  async getSettingsByCategory(category: string): Promise<Setting[]> {
    return apiRequest(`/settings/category/${category}`);
  },

  async createSetting(setting: Omit<Setting, 'id' | 'createdAt' | 'updatedAt'>): Promise<Setting> {
    return apiRequest('/settings', {
      method: 'POST',
      body: JSON.stringify(setting),
    });
  },

  async updateSetting(id: string, setting: Partial<Setting>): Promise<Setting> {
    return apiRequest(`/settings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(setting),
    });
  },

  async deleteSetting(id: string): Promise<void> {
    return apiRequest(`/settings/${id}`, {
      method: 'DELETE',
    });
  },

  async getAppSettings(): Promise<AppSettings> {
    return apiRequest('/settings/app');
  },

  async updateAppSettings(settings: Partial<AppSettings>): Promise<{ message: string }> {
    return apiRequest('/settings/app', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },
};
