/**
 * CSV Export Utilities
 * ====================
 * Functions to export various data types to CSV format
 */

export interface CattleExportData {
  id: number;
  nlisId: string;
  biometricId: string | null;
  breed: string;
  color: string;
  cattleType: string;
  birthDate: string;
  currentWeight: number;
  currentLocation: string;
  healthStatus: string;
  currentValuation: number;
  acquisitionCost: number;
  clientId: number;
  gpsLatitude: string | null;
  gpsLongitude: string | null;
}

export interface ClientExportData {
  id: number;
  name: string;
  contactEmail: string;
  contactPhone: string;
  abn: string;
  address: string;
  cattleCount: number;
  totalValue: number;
}

export interface ValuationExportData {
  id: number;
  cattleId: number;
  nlisId: string;
  breed: string;
  valuationDate: string;
  marketValue: number;
  valuationMethod: string;
}

/**
 * Convert array of objects to CSV string
 */
function arrayToCSV<T extends Record<string, any>>(data: T[]): string {
  if (data.length === 0) return '';

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV header row
  const headerRow = headers.join(',');
  
  // Create data rows
  const dataRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      
      // Handle null/undefined
      if (value === null || value === undefined) return '';
      
      // Handle strings with commas or quotes
      if (typeof value === 'string') {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }
      
      // Handle numbers and booleans
      return String(value);
    }).join(',');
  });
  
  return [headerRow, ...dataRows].join('\n');
}

/**
 * Download CSV file
 */
function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Export cattle data to CSV
 */
export function exportCattleToCSV(cattle: CattleExportData[], filename?: string) {
  const csvData = cattle.map(c => ({
    'NLIS ID': c.nlisId,
    'Biometric ID': c.biometricId || 'N/A',
    'Breed': c.breed,
    'Color': c.color,
    'Type': c.cattleType,
    'Birth Date': c.birthDate,
    'Current Weight (kg)': c.currentWeight,
    'Location': c.currentLocation,
    'Health Status': c.healthStatus,
    'Current Valuation (AUD)': (c.currentValuation / 100).toFixed(2),
    'Acquisition Cost (AUD)': (c.acquisitionCost / 100).toFixed(2),
    'Unrealized Gain (AUD)': ((c.currentValuation - c.acquisitionCost) / 100).toFixed(2),
    'Client ID': c.clientId,
    'GPS Latitude': c.gpsLatitude || 'N/A',
    'GPS Longitude': c.gpsLongitude || 'N/A',
  }));
  
  const csv = arrayToCSV(csvData);
  const date = new Date().toISOString().split('T')[0];
  downloadCSV(csv, filename || `cattle-export-${date}.csv`);
}

/**
 * Export clients data to CSV
 */
export function exportClientsToCSV(clients: ClientExportData[], filename?: string) {
  const csvData = clients.map(c => ({
    'Client ID': c.id,
    'Name': c.name,
    'Email': c.contactEmail,
    'Phone': c.contactPhone,
    'ABN': c.abn,
    'Address': c.address,
    'Cattle Count': c.cattleCount,
    'Total Portfolio Value (AUD)': (c.totalValue / 100).toFixed(2),
    'Average Value per Head (AUD)': c.cattleCount > 0 ? ((c.totalValue / c.cattleCount) / 100).toFixed(2) : '0.00',
  }));
  
  const csv = arrayToCSV(csvData);
  const date = new Date().toISOString().split('T')[0];
  downloadCSV(csv, filename || `clients-export-${date}.csv`);
}

/**
 * Export valuations data to CSV
 */
export function exportValuationsToCSV(valuations: ValuationExportData[], filename?: string) {
  const csvData = valuations.map(v => ({
    'Valuation ID': v.id,
    'Cattle ID': v.cattleId,
    'NLIS ID': v.nlisId,
    'Breed': v.breed,
    'Valuation Date': v.valuationDate,
    'Market Value (AUD)': (v.marketValue / 100).toFixed(2),
    'Valuation Method': v.valuationMethod,
  }));
  
  const csv = arrayToCSV(csvData);
  const date = new Date().toISOString().split('T')[0];
  downloadCSV(csv, filename || `valuations-export-${date}.csv`);
}

/**
 * Export lifecycle events to CSV
 */
export interface LifecycleEventExportData {
  id: number;
  cattleId: number;
  nlisId: string;
  eventType: string;
  eventDate: string;
  description: string;
  location: string | null;
  performedBy: string | null;
}

export function exportLifecycleEventsToCSV(events: LifecycleEventExportData[], filename?: string) {
  const csvData = events.map(e => ({
    'Event ID': e.id,
    'Cattle ID': e.cattleId,
    'NLIS ID': e.nlisId,
    'Event Type': e.eventType,
    'Event Date': e.eventDate,
    'Description': e.description,
    'Location': e.location || 'N/A',
    'Performed By': e.performedBy || 'N/A',
  }));
  
  const csv = arrayToCSV(csvData);
  const date = new Date().toISOString().split('T')[0];
  downloadCSV(csv, filename || `lifecycle-events-export-${date}.csv`);
}
