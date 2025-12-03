/**
 * iCattle Demo Data Generator
 * ============================
 * 
 * Generates realistic demo data for cutting-edge client presentations:
 * - 3 producer clients (different types)
 * - 50+ cattle digital twins
 * - Lifecycle events for each animal
 * - Real-time valuations
 * - Market data (simulated MLA prices)
 */

import { drizzle } from "drizzle-orm/mysql2";
import { clients, cattle, lifecycleEvents, valuations, marketData } from "../drizzle/schema";

const db = drizzle(process.env.DATABASE_URL!);

// Australian cattle breeds
const BREEDS = [
  "Angus", "Hereford", "Wagyu", "Charolais", "Simmental",
  "Limousin", "Brahman", "Droughtmaster", "Santa Gertrudis",
  "Murray Grey", "Shorthorn", "Speckle Park"
];

const COLORS = [
  "Black", "Red", "Brown", "White", "Grey", 
  "Black & White", "Red & White", "Brindle"
];

const LOCATIONS = [
  "North Paddock", "South Paddock", "River Flat", "Hill Country",
  "Home Paddock", "Back Paddock", "Creek Paddock", "Top Paddock"
];

// GPS coordinates for paddocks (Riverina region, NSW)
const PADDOCK_GPS: Record<string, { lat: number; lng: number; radius: number }> = {
  "North Paddock": { lat: -35.1082, lng: 147.3598, radius: 0.01 },
  "South Paddock": { lat: -35.1282, lng: 147.3598, radius: 0.01 },
  "River Flat": { lat: -35.1182, lng: 147.3798, radius: 0.008 },
  "Hill Country": { lat: -35.0982, lng: 147.3498, radius: 0.012 },
  "Home Paddock": { lat: -35.1182, lng: 147.3598, radius: 0.005 },
  "Back Paddock": { lat: -35.1382, lng: 147.3698, radius: 0.01 },
  "Creek Paddock": { lat: -35.1082, lng: 147.3898, radius: 0.009 },
  "Top Paddock": { lat: -35.0882, lng: 147.3598, radius: 0.011 },
};

// Generate random GPS within paddock
function generateGPS(location: string): { lat: string; lng: string } {
  const paddock = PADDOCK_GPS[location];
  if (!paddock) {
    return { lat: "-35.1182", lng: "147.3598" }; // Default center
  }
  
  // Random offset within radius
  const angle = Math.random() * 2 * Math.PI;
  const distance = Math.random() * paddock.radius;
  const lat = paddock.lat + distance * Math.cos(angle);
  const lng = paddock.lng + distance * Math.sin(angle);
  
  return {
    lat: lat.toFixed(6),
    lng: lng.toFixed(6),
  };
}

const STATES = ["NSW", "VIC", "QLD", "SA", "WA"];

// Generate random date within range
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Generate random integer
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate random element from array
function randomElement<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)]!;
}

// Generate NLIS ID (16 characters)
function generateNLIS(): string {
  const prefix = "982";
  const numbers = Array.from({ length: 13 }, () => randomInt(0, 9)).join("");
  return prefix + numbers;
}

// Generate biometric ID (simulated AI hash)
function generateBiometricId(): string {
  return Array.from({ length: 16 }, () => 
    randomInt(0, 15).toString(16)
  ).join("");
}

async function generateClients() {
  console.log("\n🏢 Generating clients...");
  
  const clientsData = [
    {
      name: "Riverina Pastoral Company",
      abn: "12345678901",
      contactName: "James Mitchell",
      contactEmail: "james@riverina-pastoral.com.au",
      contactPhone: "0412 345 678",
      address: "1250 Sturt Highway",
      state: "NSW",
      postcode: "2650",
      propertySize: 5000,
      clientType: "producer" as const,
      status: "active" as const,
    },
    {
      name: "Gippsland Premium Beef",
      abn: "98765432109",
      contactName: "Sarah Thompson",
      contactEmail: "sarah@gippsland-beef.com.au",
      contactPhone: "0423 456 789",
      address: "780 South Gippsland Highway",
      state: "VIC",
      postcode: "3950",
      propertySize: 3200,
      clientType: "feedlot" as const,
      status: "active" as const,
    },
    {
      name: "Darling Downs Wagyu Stud",
      abn: "45678912301",
      contactName: "Michael Chen",
      contactEmail: "michael@ddwagyu.com.au",
      contactPhone: "0434 567 890",
      address: "2100 Warrego Highway",
      state: "QLD",
      postcode: "4350",
      propertySize: 1500,
      clientType: "breeder" as const,
      status: "active" as const,
    },
  ];
  
  for (const client of clientsData) {
    await db.insert(clients).values(client);
  }
  
  console.log(`✅ Created ${clientsData.length} clients`);
  
  return await db.select().from(clients);
}

async function generateCattle(clientsList: typeof clients.$inferSelect[]) {
  console.log("\n🐄 Generating cattle digital twins...");
  
  const cattleData = [];
  const now = new Date();
  
  // Generate 50+ cattle across all clients
  for (const client of clientsList) {
    const numCattle = client.clientType === "breeder" ? 15 : 
                     client.clientType === "feedlot" ? 25 : 20;
    
    for (let i = 0; i < numCattle; i++) {
      const breed = client.clientType === "breeder" && client.name.includes("Wagyu") 
        ? "Wagyu" 
        : randomElement(BREEDS);
      
      const sex = randomElement(["bull", "steer", "cow", "heifer", "calf"] as const);
      const cattleType = client.clientType === "breeder" ? "breeding" :
                        client.clientType === "feedlot" ? "feeder" : "beef";
      
      // Age: 6 months to 4 years
      const ageMonths = randomInt(6, 48);
      const dateOfBirth = new Date(now);
      dateOfBirth.setMonth(dateOfBirth.getMonth() - ageMonths);
      
      // Weight based on age and sex
      const baseWeight = sex === "bull" ? 600 : sex === "steer" ? 550 : 
                        sex === "cow" ? 500 : sex === "heifer" ? 450 : 250;
      const weight = baseWeight + randomInt(-50, 100);
      
      // Valuation: $3-6 per kg for beef, $8-15 per kg for Wagyu
      const pricePerKg = breed === "Wagyu" ? randomInt(800, 1500) : randomInt(300, 600);
      const valuation = weight * pricePerKg; // cents
      
      const acquisitionDate = randomDate(dateOfBirth, now);
      const acquisitionCost = Math.floor(valuation * (0.7 + Math.random() * 0.3));
      
      const location = randomElement(LOCATIONS);
      const gps = generateGPS(location);
      
      cattleData.push({
        nlisId: generateNLIS(),
        visualId: `${client.name.split(' ')[0]}-${i + 1}`,
        biometricId: generateBiometricId(),
        breed,
        sex,
        dateOfBirth,
        clientId: client.id,
        currentLocation: location,
        latitude: gps.lat,
        longitude: gps.lng,
        lastGpsUpdate: randomDate(new Date(now.getTime() - 24 * 60 * 60 * 1000), now),
        currentWeight: weight,
        lastWeighDate: randomDate(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), now),
        color: randomElement(COLORS),
        cattleType,
        grade: cattleType === "beef" ? randomElement(["MSA", "Prime", "Choice", null]) : null,
        healthStatus: randomElement(["healthy", "healthy", "healthy", "healthy", "sick"] as const),
        lastHealthCheck: randomDate(new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), now),
        currentValuation: valuation,
        lastValuationDate: now,
        acquisitionCost,
        acquisitionDate,
        status: "active" as const,
        imageUrl: null,
        notes: null,
      });
    }
  }
  
  await db.insert(cattle).values(cattleData);
  
  console.log(`✅ Created ${cattleData.length} cattle digital twins`);
  
  return await db.select().from(cattle);
}

async function generateLifecycleEvents(cattleList: typeof cattle.$inferSelect[]) {
  console.log("\n📋 Generating lifecycle events...");
  
  const eventsData = [];
  const now = new Date();
  
  for (const animal of cattleList) {
    // Birth/acquisition event
    eventsData.push({
      cattleId: animal.id,
      eventType: animal.dateOfBirth ? "birth" : "acquisition" as const,
      eventDate: animal.dateOfBirth || animal.acquisitionDate!,
      details: JSON.stringify({
        location: animal.currentLocation,
        weight: Math.floor(animal.currentWeight! * 0.3), // Birth weight ~30% of current
      }),
      weight: Math.floor(animal.currentWeight! * 0.3),
      fromLocation: null,
      toLocation: animal.currentLocation,
      healthStatus: null,
      veterinarian: null,
      amount: animal.dateOfBirth ? null : animal.acquisitionCost,
      recordedBy: null,
      notes: animal.dateOfBirth ? "Born on property" : "Acquired from market",
    });
    
    // Generate 3-8 events per animal
    const numEvents = randomInt(3, 8);
    const eventStart = animal.dateOfBirth || animal.acquisitionDate!;
    
    for (let i = 0; i < numEvents; i++) {
      const eventDate = randomDate(eventStart, now);
      const eventType = randomElement([
        "weight_update", "weight_update", "weight_update", // More weight updates
        "health_check", "health_check",
        "vaccination", "treatment", "movement", "grading"
      ] as const);
      
      let details: any = {};
      let weight = null;
      let fromLocation = null;
      let toLocation = null;
      let healthStatus = null;
      let veterinarian = null;
      let amount = null;
      let notes = null;
      
      switch (eventType) {
        case "weight_update":
          weight = animal.currentWeight! + randomInt(-20, 20);
          details = { weight, method: "scales" };
          notes = "Regular weight check";
          break;
        case "health_check":
          healthStatus = "healthy";
          veterinarian = randomElement(["Dr. Smith", "Dr. Jones", "Dr. Brown"]);
          details = { status: "healthy", temperature: 38.5 + Math.random() };
          notes = "Routine health check";
          break;
        case "vaccination":
          veterinarian = randomElement(["Dr. Smith", "Dr. Jones", "Dr. Brown"]);
          details = { vaccine: randomElement(["7-in-1", "Botulism", "Vibrio"]) };
          notes = "Annual vaccination";
          break;
        case "treatment":
          veterinarian = randomElement(["Dr. Smith", "Dr. Jones", "Dr. Brown"]);
          details = { condition: "minor injury", treatment: "antibiotics" };
          notes = "Treated for minor condition";
          break;
        case "movement":
          fromLocation = animal.currentLocation;
          toLocation = randomElement(LOCATIONS.filter(l => l !== fromLocation));
          details = { from: fromLocation, to: toLocation, reason: "rotation" };
          notes = "Paddock rotation";
          break;
        case "grading":
          details = { grade: randomElement(["MSA", "Prime", "Choice"]), assessor: "MSA Grader" };
          notes = "MSA grading assessment";
          break;
      }
      
      eventsData.push({
        cattleId: animal.id,
        eventType,
        eventDate,
        details: JSON.stringify(details),
        weight,
        fromLocation,
        toLocation,
        healthStatus,
        veterinarian,
        amount,
        recordedBy: null,
        notes,
      });
    }
  }
  
  await db.insert(lifecycleEvents).values(eventsData);
  
  console.log(`✅ Created ${eventsData.length} lifecycle events`);
}

async function generateValuations(cattleList: typeof cattle.$inferSelect[]) {
  console.log("\n💰 Generating valuation history...");
  
  const valuationsData = [];
  const now = new Date();
  
  for (const animal of cattleList) {
    // Generate 5-10 historical valuations
    const numValuations = randomInt(5, 10);
    const startDate = animal.acquisitionDate || animal.dateOfBirth!;
    
    for (let i = 0; i < numValuations; i++) {
      const valuationDate = new Date(
        startDate.getTime() + 
        ((now.getTime() - startDate.getTime()) / numValuations) * i
      );
      
      // Price trend: generally increasing with some volatility
      const basePricePerKg = animal.breed === "Wagyu" ? 1000 : 400;
      const trend = 1 + (i / numValuations) * 0.2; // 20% increase over time
      const volatility = 0.9 + Math.random() * 0.2; // ±10% volatility
      const pricePerKg = Math.floor(basePricePerKg * trend * volatility);
      
      const weight = animal.currentWeight! + randomInt(-30, 30);
      const valuationAmount = weight * pricePerKg;
      
      valuationsData.push({
        cattleId: animal.id,
        valuationDate,
        valuationAmount,
        method: randomElement(["market", "weight", "comparable"] as const),
        marketPrice: pricePerKg,
        weight,
        comparableBreed: animal.breed,
        comparableAge: Math.floor((now.getTime() - (animal.dateOfBirth?.getTime() || now.getTime())) / (1000 * 60 * 60 * 24 * 30)),
        comparableLocation: animal.currentLocation,
        dataSource: "MLA",
        confidence: randomElement(["high", "medium"] as const),
        calculatedBy: "system",
        notes: i === numValuations - 1 ? "Latest valuation" : null,
      });
    }
  }
  
  await db.insert(valuations).values(valuationsData);
  
  console.log(`✅ Created ${valuationsData.length} valuations`);
}

async function generateMarketData() {
  console.log("\n📊 Generating market data (simulated MLA prices)...");
  
  const marketDataList = [];
  const now = new Date();
  
  // Generate 30 days of market data
  for (let day = 0; day < 30; day++) {
    const date = new Date(now);
    date.setDate(date.getDate() - day);
    
    // Categories based on MLA National Livestock Reporting Service
    const categories = [
      { category: "Heavy Steer (>600kg)", basePrice: 420, state: "NSW" },
      { category: "Medium Steer (400-600kg)", basePrice: 450, state: "NSW" },
      { category: "Yearling Steer (300-400kg)", basePrice: 480, state: "NSW" },
      { category: "Heavy Heifer (>500kg)", basePrice: 400, state: "VIC" },
      { category: "Medium Heifer (350-500kg)", basePrice: 430, state: "VIC" },
      { category: "Cow (>500kg)", basePrice: 350, state: "QLD" },
      { category: "Wagyu Steer (>550kg)", basePrice: 1200, state: "NSW" },
      { category: "Wagyu Heifer (>450kg)", basePrice: 1100, state: "VIC" },
    ];
    
    for (const cat of categories) {
      // Add trend and volatility
      const trend = 1 + (day / 30) * 0.05; // 5% decline over 30 days (older = lower)
      const volatility = 0.95 + Math.random() * 0.1; // ±5% daily volatility
      const pricePerKg = Math.floor(cat.basePrice * trend * volatility);
      
      marketDataList.push({
        date,
        category: cat.category,
        breed: cat.category.includes("Wagyu") ? "Wagyu" : null,
        pricePerKg,
        state: cat.state,
        region: cat.state === "NSW" ? "Riverina" : cat.state === "VIC" ? "Gippsland" : "Darling Downs",
        source: "MLA",
      });
    }
  }
  
  await db.insert(marketData).values(marketDataList);
  
  console.log(`✅ Created ${marketDataList.length} market data points`);
}

async function main() {
  console.log("🚀 iCattle Demo Data Generator");
  console.log("================================\n");
  
  try {
    // Generate all demo data
    const clientsList = await generateClients();
    const cattleList = await generateCattle(clientsList);
    await generateLifecycleEvents(cattleList);
    await generateValuations(cattleList);
    await generateMarketData();
    
    console.log("\n✅ Demo data generation complete!");
    console.log("\n📊 Summary:");
    console.log(`   • ${clientsList.length} clients`);
    console.log(`   • ${cattleList.length} cattle digital twins`);
    console.log(`   • Lifecycle events for all cattle`);
    console.log(`   • Valuation history for all cattle`);
    console.log(`   • 30 days of market data`);
    console.log("\n🎯 Ready for cutting-edge demo!");
    
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error generating demo data:", error);
    process.exit(1);
  }
}

main();
