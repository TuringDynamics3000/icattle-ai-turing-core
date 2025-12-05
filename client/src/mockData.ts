// Mock data for 100,000 cattle demo
// Realistic Australian beef cattle industry data

export const portfolioSummary = {
  totalClients: 25,
  totalCattle: 100000,
  totalValue: 350000000, // $350M
  avgValue: 3500, // $3,500 per head
  avgWeight: 485, // kg
};

export const clients = [
  { id: 1, name: "Riverside Cattle Station", state: "NSW", postcode: "2650", cattle_count: 12000, total_value: 42000000 },
  { id: 2, name: "Highland Breeding Farm", state: "NSW", postcode: "2350", cattle_count: 10000, total_value: 38000000 },
  { id: 3, name: "Golden Plains Pastoral", state: "QLD", postcode: "4350", cattle_count: 9500, total_value: 35000000 },
  { id: 4, name: "Outback Beef Co", state: "NT", postcode: "0870", cattle_count: 8500, total_value: 28000000 },
  { id: 5, name: "Southern Cross Cattle", state: "VIC", postcode: "3550", cattle_count: 7500, total_value: 26000000 },
  { id: 6, name: "Kimberley Pastoral", state: "WA", postcode: "6770", cattle_count: 7000, total_value: 23000000 },
  { id: 7, name: "Top End Beef", state: "NT", postcode: "0850", cattle_count: 6500, total_value: 21000000 },
  { id: 8, name: "Murray Valley Grazing", state: "NSW", postcode: "2700", cattle_count: 6000, total_value: 20000000 },
  { id: 9, name: "Barkly Tablelands", state: "NT", postcode: "0862", cattle_count: 5500, total_value: 18000000 },
  { id: 10, name: "Flinders Ranges Cattle", state: "SA", postcode: "5434", cattle_count: 5000, total_value: 17000000 },
  { id: 11, name: "Central Queensland Beef", state: "QLD", postcode: "4702", cattle_count: 4500, total_value: 15000000 },
  { id: 12, name: "Pilbara Pastoral", state: "WA", postcode: "6751", cattle_count: 4000, total_value: 13000000 },
  { id: 13, name: "New England Cattle Co", state: "NSW", postcode: "2360", cattle_count: 3500, total_value: 12000000 },
  { id: 14, name: "Gulf Country Beef", state: "QLD", postcode: "4824", cattle_count: 3000, total_value: 10000000 },
  { id: 15, name: "Gippsland Premium Beef", state: "VIC", postcode: "3850", cattle_count: 2500, total_value: 9000000 },
  { id: 16, name: "Eyre Peninsula Grazing", state: "SA", postcode: "5690", cattle_count: 2000, total_value: 7000000 },
  { id: 17, name: "Tasmanian Highland Beef", state: "TAS", postcode: "7306", cattle_count: 1500, total_value: 6000000 },
  { id: 18, name: "Gascoyne Cattle Co", state: "WA", postcode: "6701", cattle_count: 1200, total_value: 4000000 },
  { id: 19, name: "Darling Downs Pastoral", state: "QLD", postcode: "4380", cattle_count: 1000, total_value: 3500000 },
  { id: 20, name: "Riverina Beef Producers", state: "NSW", postcode: "2680", cattle_count: 800, total_value: 2800000 },
  { id: 21, name: "Yorke Peninsula Cattle", state: "SA", postcode: "5576", cattle_count: 600, total_value: 2000000 },
  { id: 22, name: "King Island Premium Beef", state: "TAS", postcode: "7256", cattle_count: 500, total_value: 2000000 },
  { id: 23, name: "Esperance Pastoral", state: "WA", postcode: "6450", cattle_count: 400, total_value: 1300000 },
  { id: 24, name: "Western District Grazing", state: "VIC", postcode: "3300", cattle_count: 300, total_value: 1000000 },
  { id: 25, name: "Atherton Tablelands Beef", state: "QLD", postcode: "4883", cattle_count: 200, total_value: 700000 },
];

export const breedDistribution = [
  { breed: "Angus", count: 25000, total_value: 95000000, avg_weight: 520 },
  { breed: "Hereford", count: 15000, total_value: 52500000, avg_weight: 500 },
  { breed: "Brahman", count: 12000, total_value: 39600000, avg_weight: 480 },
  { breed: "Droughtmaster", count: 10000, total_value: 33000000, avg_weight: 475 },
  { breed: "Santa Gertrudis", count: 8000, total_value: 27200000, avg_weight: 495 },
  { breed: "Charolais", count: 7000, total_value: 25900000, avg_weight: 540 },
  { breed: "Limousin", count: 6000, total_value: 22800000, avg_weight: 530 },
  { breed: "Murray Grey", count: 5000, total_value: 17500000, avg_weight: 485 },
  { breed: "Wagyu", count: 4000, total_value: 16000000, avg_weight: 450 },
  { breed: "Simmental", count: 3500, total_value: 12950000, avg_weight: 550 },
  { breed: "Belmont Red", count: 2500, total_value: 8250000, avg_weight: 470 },
  { breed: "Shorthorn", count: 2000, total_value: 7000000, avg_weight: 490 },
];

export const stateDistribution = [
  { state: "QLD", count: 30000, total_value: 105000000 },
  { state: "NSW", count: 25000, total_value: 87500000 },
  { state: "NT", count: 15000, total_value: 49500000 },
  { state: "VIC", count: 10000, total_value: 35000000 },
  { state: "WA", count: 10000, total_value: 33000000 },
  { state: "SA", count: 8000, total_value: 28000000 },
  { state: "TAS", count: 2000, total_value: 8000000 },
];

// Sample cattle records for Golden Record view
export const sampleCattle = Array.from({ length: 50 }, (_, i) => {
  const breeds = ["Angus", "Hereford", "Brahman", "Droughtmaster", "Santa Gertrudis", "Charolais", "Wagyu"];
  const types = ["beef", "breeding", "feeder"];
  const sexes = ["bull", "steer", "cow", "heifer"];
  const statuses = ["healthy", "healthy", "healthy", "healthy", "sick"];
  
  const breed = breeds[i % breeds.length];
  const weight = 350 + Math.floor(Math.random() * 300);
  const pricePerKg = 3.5 + Math.random() * 2;
  const value = weight * pricePerKg;
  
  return {
    id: 100000 - i,
    nlis_id: `AUQLD${String(100000 - i).padStart(8, '0')}`,
    visual_id: `GLD-${String(100000 - i).padStart(5, '0')}`,
    breed,
    cattle_type: types[i % types.length],
    sex: sexes[i % sexes.length],
    weight,
    current_valuation: value,
    health_status: statuses[i % statuses.length],
    date_of_birth: new Date(Date.now() - (365 + Math.random() * 1095) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    client_name: clients[i % clients.length].name,
    state: clients[i % clients.length].state,
    status: 'active'
  };
});
