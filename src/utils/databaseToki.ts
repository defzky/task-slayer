/**
 * DatabaseToki Integration for Task Slayer
 * Replaces Chrome storage/localStorage with DatabaseToki API
 */

// DatabaseToki configuration
const DB_URL = 'https://databasetoki.vercel.app'; // Production URL
const PROJECT_ID = 'task-slayer-6faab9da';
const API_KEY = 'dbtoki_live_09c447d8706549acb788f4d2636b3ad7';

interface DatabaseTokiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Generic fetch wrapper
async function fetchDB(endpoint: string, options: RequestInit = {}): Promise<DatabaseTokiResponse> {
  const url = `${DB_URL}/api/${PROJECT_ID}${endpoint}`;
  
  const headers = {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  try {
    const response = await fetch(url, { ...options, headers });
    const data = await response.json();
    
    if (!data.success) {
      console.error('DatabaseToki error:', data.error);
      return { success: false, error: data.error };
    }
    
    return data;
  } catch (error) {
    console.error('DatabaseToki fetch error:', error);
    return { success: false, error: 'Network error' };
  }
}

// Save data to specific table
export async function saveToTable(table: string, data: any): Promise<boolean> {
  try {
    const response = await fetchDB(`/${table}`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    
    return response.success;
  } catch (error) {
    console.error(`Failed to save to ${table}:`, error);
    return false;
  }
}

// Get all data from specific table
export async function getFromTable(table: string): Promise<any[]> {
  try {
    const response = await fetchDB(`/${table}`);
    
    if (response.success && Array.isArray(response.data)) {
      return response.data;
    }
    
    return [];
  } catch (error) {
    console.error(`Failed to get from ${table}:`, error);
    return [];
  }
}

// Update data in specific table by ID
export async function updateInTable(table: string, id: string, data: any): Promise<boolean> {
  try {
    // For now, we'll implement this as delete + insert
    // In a real implementation, you'd have a proper UPDATE endpoint
    const response = await fetchDB(`/${table}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    
    return response.success;
  } catch (error) {
    console.error(`Failed to update ${table} ${id}:`, error);
    return false;
  }
}

// Delete data from specific table by ID
export async function deleteFromTable(table: string, id: string): Promise<boolean> {
  try {
    const response = await fetchDB(`/${table}/${id}`, {
      method: 'DELETE'
    });
    
    return response.success;
  } catch (error) {
    console.error(`Failed to delete ${table} ${id}:`, error);
    return false;
  }
}

// Initialize database tables
export async function initializeDatabase(): Promise<void> {
  // Create initial tables if they don't exist
  // The API will create tables automatically on first insert
  console.log('DatabaseToki initialized for Task Slayer');
}