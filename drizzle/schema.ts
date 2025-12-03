import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, index } from "drizzle-orm/mysql-core";

/**
 * iCattle Database Schema
 * ========================
 * Source of Truth for Livestock Ownership & Valuation
 * 
 * Core entities:
 * - users: Platform users (producers, bank staff, investors)
 * - clients: Producer/farm entities
 * - cattle: Digital twins for individual animals
 * - lifecycle_events: Complete audit trail
 * - valuations: Real-time mark-to-market history
 */

// ============================================================================
// USERS & AUTHENTICATION
// ============================================================================

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "farmer", "bank", "investor"]).default("user").notNull(),
  viewPreference: varchar("viewPreference", { length: 50 }), // farmer, bank, investor, admin
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================================================
// CLIENTS (Producers/Farms)
// ============================================================================

export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  abn: varchar("abn", { length: 11 }),
  contactName: varchar("contactName", { length: 255 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  contactPhone: varchar("contactPhone", { length: 20 }),
  address: text("address"),
  state: varchar("state", { length: 3 }), // NSW, VIC, QLD, etc.
  postcode: varchar("postcode", { length: 4 }),
  propertySize: int("propertySize"), // hectares
  clientType: mysqlEnum("clientType", ["producer", "feedlot", "breeder", "dairy"]).notNull(),
  status: mysqlEnum("status", ["active", "inactive", "suspended"]).default("active").notNull(),
  agriwebbFarmId: varchar("agriwebbFarmId", { length: 255 }), // AgriWebb farm ID
  agriwebbConnected: boolean("agriwebbConnected").default(false), // Is AgriWebb connected?
  agriwebbLastSync: timestamp("agriwebbLastSync"), // Last sync timestamp
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

// ============================================================================
// CATTLE DIGITAL TWINS
// ============================================================================

export const cattle = mysqlTable("cattle", {
  id: int("id").autoincrement().primaryKey(),
  
  // Identification
  nlisId: varchar("nlisId", { length: 16 }).unique(), // NLIS tag number
  visualId: varchar("visualId", { length: 50 }), // Farm tag/name
  biometricId: varchar("biometricId", { length: 64 }).unique(), // AI-generated unique ID
  agriwebbId: varchar("agriwebbId", { length: 255 }), // AgriWebb animal ID
  
  // Basic Info
  breed: varchar("breed", { length: 100 }).notNull(), // Angus, Hereford, Wagyu, etc.
  sex: mysqlEnum("sex", ["bull", "steer", "cow", "heifer", "calf"]).notNull(),
  dateOfBirth: timestamp("dateOfBirth"),
  
  // Ownership
  clientId: int("clientId").notNull().references(() => clients.id),
  currentLocation: varchar("currentLocation", { length: 255 }),
  
  // GPS Tracking
  latitude: varchar("latitude", { length: 20 }), // Decimal degrees
  longitude: varchar("longitude", { length: 20 }), // Decimal degrees
  lastGpsUpdate: timestamp("lastGpsUpdate"), // Last GPS update timestamp
  
  // Physical Attributes
  currentWeight: int("currentWeight"), // kg
  lastWeighDate: timestamp("lastWeighDate"),
  color: varchar("color", { length: 100 }),
  
  // Classification
  cattleType: mysqlEnum("cattleType", ["beef", "dairy", "breeding", "feeder"]).notNull(),
  grade: varchar("grade", { length: 50 }), // MSA grade
  
  // Pedigree (for breeding cattle)
  sireId: int("sireId"), // Father
  damId: int("damId"), // Mother
  pedigreeDetails: text("pedigreeDetails"), // JSON with full pedigree
  
  // Health
  healthStatus: mysqlEnum("healthStatus", ["healthy", "sick", "quarantine", "deceased"]).default("healthy").notNull(),
  lastHealthCheck: timestamp("lastHealthCheck"),
  
  // Valuation
  currentValuation: int("currentValuation"), // AUD cents
  lastValuationDate: timestamp("lastValuationDate"),
  acquisitionCost: int("acquisitionCost"), // AUD cents
  acquisitionDate: timestamp("acquisitionDate"),
  
  // Status
  status: mysqlEnum("status", ["active", "sold", "deceased", "transferred"]).default("active").notNull(),
  
  // Metadata
  imageUrl: varchar("imageUrl", { length: 500 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  clientIdx: index("client_idx").on(table.clientId),
  statusIdx: index("status_idx").on(table.status),
  breedIdx: index("breed_idx").on(table.breed),
}));

export type Cattle = typeof cattle.$inferSelect;
export type InsertCattle = typeof cattle.$inferInsert;

// ============================================================================
// LIFECYCLE EVENTS (Event Sourcing)
// ============================================================================

export const lifecycleEvents = mysqlTable("lifecycleEvents", {
  id: int("id").autoincrement().primaryKey(),
  cattleId: int("cattleId").notNull().references(() => cattle.id),
  
  eventType: mysqlEnum("eventType", [
    "birth",
    "acquisition",
    "weight_update",
    "health_check",
    "vaccination",
    "treatment",
    "movement",
    "grading",
    "breeding",
    "calving",
    "sale",
    "death",
    "transfer"
  ]).notNull(),
  
  eventDate: timestamp("eventDate").notNull(),
  
  // Event Details (JSON)
  details: text("details").notNull(), // JSON with event-specific data
  
  // Weight (for weight_update events)
  weight: int("weight"), // kg
  
  // Location (for movement events)
  fromLocation: varchar("fromLocation", { length: 255 }),
  toLocation: varchar("toLocation", { length: 255 }),
  
  // Health (for health/vaccination/treatment events)
  healthStatus: varchar("healthStatus", { length: 100 }),
  veterinarian: varchar("veterinarian", { length: 255 }),
  
  // Financial (for sale/acquisition events)
  amount: int("amount"), // AUD cents
  
  // Metadata
  recordedBy: int("recordedBy").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  cattleIdx: index("cattle_idx").on(table.cattleId),
  eventTypeIdx: index("event_type_idx").on(table.eventType),
  eventDateIdx: index("event_date_idx").on(table.eventDate),
}));

export type LifecycleEvent = typeof lifecycleEvents.$inferSelect;
export type InsertLifecycleEvent = typeof lifecycleEvents.$inferInsert;

// ============================================================================
// VALUATIONS (Real-Time Mark-to-Market)
// ============================================================================

export const valuations = mysqlTable("valuations", {
  id: int("id").autoincrement().primaryKey(),
  cattleId: int("cattleId").notNull().references(() => cattle.id),
  
  valuationDate: timestamp("valuationDate").notNull(),
  valuationAmount: int("valuationAmount").notNull(), // AUD cents
  
  // Valuation Method
  method: mysqlEnum("method", ["market", "weight", "breeding", "comparable"]).notNull(),
  
  // Market Data
  marketPrice: int("marketPrice"), // AUD cents per kg
  weight: int("weight"), // kg at valuation time
  
  // Comparable Data (for market method)
  comparableBreed: varchar("comparableBreed", { length: 100 }),
  comparableAge: int("comparableAge"), // months
  comparableLocation: varchar("comparableLocation", { length: 100 }),
  
  // Source
  dataSource: varchar("dataSource", { length: 100 }), // "MLA", "AuctionsPlus", "Manual"
  
  // Confidence
  confidence: mysqlEnum("confidence", ["high", "medium", "low"]).default("medium"),
  
  // Metadata
  calculatedBy: varchar("calculatedBy", { length: 100 }), // "system" or user ID
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  cattleIdx: index("cattle_idx").on(table.cattleId),
  dateIdx: index("date_idx").on(table.valuationDate),
}));

export type Valuation = typeof valuations.$inferSelect;
export type InsertValuation = typeof valuations.$inferInsert;

// ============================================================================
// MARKET DATA (Simulated MLA Prices)
// ============================================================================

export const marketData = mysqlTable("marketData", {
  id: int("id").autoincrement().primaryKey(),
  
  date: timestamp("date").notNull(),
  
  // Cattle Category
  category: varchar("category", { length: 100 }).notNull(), // "Heavy Steer", "Yearling Heifer", etc.
  breed: varchar("breed", { length: 100 }),
  
  // Price Data
  pricePerKg: int("pricePerKg").notNull(), // AUD cents per kg
  
  // Location
  state: varchar("state", { length: 3 }),
  region: varchar("region", { length: 100 }),
  
  // Source
  source: varchar("source", { length: 100 }).default("MLA").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  dateIdx: index("date_idx").on(table.date),
  categoryIdx: index("category_idx").on(table.category),
}));

export type MarketData = typeof marketData.$inferSelect;
export type InsertMarketData = typeof marketData.$inferInsert;

// ============================================================================
// FINANCIAL REPORTS (Cached)
// ============================================================================

export const financialReports = mysqlTable("financialReports", {
  id: int("id").autoincrement().primaryKey(),
  
  clientId: int("clientId").notNull().references(() => clients.id),
  reportType: mysqlEnum("reportType", ["balance_sheet", "profit_loss", "portfolio_summary"]).notNull(),
  reportDate: timestamp("reportDate").notNull(),
  
  // Report Data (JSON)
  reportData: text("reportData").notNull(), // JSON with complete report
  
  // Summary Metrics
  totalAssets: int("totalAssets"), // AUD cents
  totalLiabilities: int("totalLiabilities"), // AUD cents
  netWorth: int("netWorth"), // AUD cents
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  clientIdx: index("client_idx").on(table.clientId),
  reportTypeIdx: index("report_type_idx").on(table.reportType),
  reportDateIdx: index("report_date_idx").on(table.reportDate),
}));

export type FinancialReport = typeof financialReports.$inferSelect;
export type InsertFinancialReport = typeof financialReports.$inferInsert;

// ============================================================================
// AGRIWEBB SYNC STATUS
// ============================================================================

export const agriwebbSyncStatus = mysqlTable("agriwebbSyncStatus", {
  id: int("id").autoincrement().primaryKey(),
  
  clientId: int("clientId").notNull().references(() => clients.id),
  
  // Sync Status
  syncStatus: mysqlEnum("syncStatus", ["pending", "in_progress", "completed", "failed"]).default("pending").notNull(),
  lastSyncAttempt: timestamp("lastSyncAttempt"),
  lastSuccessfulSync: timestamp("lastSuccessfulSync"),
  
  // Sync Stats
  animalsCreated: int("animalsCreated").default(0),
  animalsUpdated: int("animalsUpdated").default(0),
  animalsSkipped: int("animalsSkipped").default(0),
  errorCount: int("errorCount").default(0),
  
  // Error Details
  errorMessage: text("errorMessage"),
  errorDetails: text("errorDetails"), // JSON with detailed errors
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  clientIdx: index("client_idx").on(table.clientId),
  statusIdx: index("status_idx").on(table.syncStatus),
}));

export type AgriwebbSyncStatus = typeof agriwebbSyncStatus.$inferSelect;
export type InsertAgriwebbSyncStatus = typeof agriwebbSyncStatus.$inferInsert;
