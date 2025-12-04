import { integer, pgEnum, pgTable, text, timestamp, varchar, decimal, boolean, index, serial } from "drizzle-orm/pg-core";

// ============================================================================
// ENUMS
// ============================================================================

export const roleEnum = pgEnum("role", ["user", "admin", "farmer", "bank", "investor"]);
export const clientTypeEnum = pgEnum("clientType", ["producer", "feedlot", "breeder", "dairy"]);
export const clientStatusEnum = pgEnum("client_status", ["active", "inactive", "suspended"]);
export const sexEnum = pgEnum("sex", ["bull", "steer", "cow", "heifer", "calf"]);
export const cattleTypeEnum = pgEnum("cattleType", ["beef", "dairy", "breeding", "feeder"]);
export const healthStatusEnum = pgEnum("healthStatus", ["healthy", "sick", "quarantine", "deceased"]);
export const cattleStatusEnum = pgEnum("cattle_status", ["active", "sold", "deceased", "transferred"]);
export const eventTypeEnum = pgEnum("eventType", [
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
]);
export const methodEnum = pgEnum("method", ["market", "weight", "breeding", "comparable"]);
export const confidenceEnum = pgEnum("confidence", ["high", "medium", "low"]);
export const reportTypeEnum = pgEnum("reportType", ["balance_sheet", "profit_loss", "portfolio_summary"]);
export const syncStatusEnum = pgEnum("syncStatus", ["pending", "in_progress", "completed", "failed"]);
export const notificationTypeEnum = pgEnum("notificationType", ["health_alert", "valuation_update", "compliance_warning", "system"]);

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
// Note: PostgreSQL does not support onUpdateNow(). Use triggers or application logic for auto-update.
// ============================================================================

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  viewPreference: varchar("viewPreference", { length: 50 }), // farmer, bank, investor, admin
  
  // Xero Integration
  xeroAccessToken: text("xeroAccessToken"),
  xeroRefreshToken: text("xeroRefreshToken"),
  xeroTokenExpiresAt: timestamp("xeroTokenExpiresAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================================================
// CLIENTS (Producers/Farms)
// ============================================================================

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  abn: varchar("abn", { length: 20 }),
  contactName: varchar("contactName", { length: 255 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  contactPhone: varchar("contactPhone", { length: 20 }),
  address: text("address"),
  state: varchar("state", { length: 3 }), // NSW, VIC, QLD, etc.
  postcode: varchar("postcode", { length: 4 }),
  propertySize: integer("propertySize"), // hectares
  clientType: clientTypeEnum("clientType").notNull(),
  status: clientStatusEnum("status").default("active").notNull(),
  agriwebbFarmId: varchar("agriwebbFarmId", { length: 255 }), // AgriWebb farm ID
  agriwebbConnected: boolean("agriwebbConnected").default(false), // Is AgriWebb connected?
  agriwebbLastSync: timestamp("agriwebbLastSync"), // Last sync timestamp
  latitude: varchar("latitude", { length: 20 }), // Farm center latitude
  longitude: varchar("longitude", { length: 20 }), // Farm center longitude
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

// ============================================================================
// CATTLE DIGITAL TWINS
// ============================================================================

export const cattle = pgTable("cattle", {
  id: serial("id").primaryKey(),
  
  // Identification
  nlisId: varchar("nlisId", { length: 16 }).unique(), // NLIS tag number
  visualId: varchar("visualId", { length: 50 }), // Farm tag/name
  biometricId: varchar("biometricId", { length: 64 }).unique(), // AI-generated unique ID
  agriwebbId: varchar("agriwebbId", { length: 255 }), // AgriWebb animal ID
  
  // Basic Info
  breed: varchar("breed", { length: 100 }).notNull(), // Angus, Hereford, Wagyu, etc.
  sex: sexEnum("sex").notNull(),
  dateOfBirth: timestamp("dateOfBirth"),
  
  // Ownership
  clientId: integer("clientId").notNull().references(() => clients.id),
  currentLocation: varchar("currentLocation", { length: 255 }),
  
  // GPS Tracking
  latitude: varchar("latitude", { length: 20 }), // Decimal degrees
  longitude: varchar("longitude", { length: 20 }), // Decimal degrees
  lastGpsUpdate: timestamp("lastGpsUpdate"), // Last GPS update timestamp
  
  // Physical Attributes
  currentWeight: integer("currentWeight"), // kg
  lastWeighDate: timestamp("lastWeighDate"),
  color: varchar("color", { length: 100 }),
  
  // Classification
  cattleType: cattleTypeEnum("cattleType").notNull(),
  grade: varchar("grade", { length: 50 }), // MSA grade
  
  // Pedigree (for breeding cattle)
  sireId: integer("sireId"), // Father
  damId: integer("damId"), // Mother
  pedigreeDetails: text("pedigreeDetails"), // JSON with full pedigree
  
  // Health
  healthStatus: healthStatusEnum("healthStatus").default("healthy").notNull(),
  lastHealthCheck: timestamp("lastHealthCheck"),
  
  // Valuation
  currentValuation: integer("currentValuation"), // AUD cents
  lastValuationDate: timestamp("lastValuationDate"),
  acquisitionCost: integer("acquisitionCost"), // AUD cents
  acquisitionDate: timestamp("acquisitionDate"),
  
  // Status
  status: cattleStatusEnum("status").default("active").notNull(),
  
  // Metadata
  imageUrl: varchar("imageUrl", { length: 500 }),
  muzzleImageUrl: varchar("muzzleImageUrl", { length: 500 }), // Biometric muzzle photo
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  clientIdx: index("cattle_client_idx").on(table.clientId),
  statusIdx: index("cattle_status_idx").on(table.status),
  breedIdx: index("cattle_breed_idx").on(table.breed),
}));

export type Cattle = typeof cattle.$inferSelect;
export type InsertCattle = typeof cattle.$inferInsert;

// ============================================================================
// LIFECYCLE EVENTS (Event Sourcing)
// ============================================================================

export const lifecycleEvents = pgTable("lifecycleEvents", {
  id: serial("id").primaryKey(),
  cattleId: integer("cattleId").notNull().references(() => cattle.id),
  
  eventType: eventTypeEnum("eventType").notNull(),
  
  eventDate: timestamp("eventDate").notNull(),
  
  // Event Details (JSON)
  details: text("details").notNull(), // JSON with event-specific data
  
  // Weight (for weight_update events)
  weight: integer("weight"), // kg
  
  // Location (for movement events)
  fromLocation: varchar("fromLocation", { length: 255 }),
  toLocation: varchar("toLocation", { length: 255 }),
  
  // Health (for health/vaccination/treatment events)
  healthStatus: varchar("healthStatus", { length: 100 }),
  veterinarian: varchar("veterinarian", { length: 255 }),
  
  // Financial (for sale/acquisition events)
  amount: integer("amount"), // AUD cents
  
  // Metadata
  recordedBy: integer("recordedBy").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  cattleIdx: index("lifecycle_cattle_idx").on(table.cattleId),
  eventTypeIdx: index("lifecycle_event_type_idx").on(table.eventType),
  eventDateIdx: index("lifecycle_event_date_idx").on(table.eventDate),
}));

export type LifecycleEvent = typeof lifecycleEvents.$inferSelect;
export type InsertLifecycleEvent = typeof lifecycleEvents.$inferInsert;

// ============================================================================
// VALUATIONS (Real-Time Mark-to-Market)
// ============================================================================

export const valuations = pgTable("valuations", {
  id: serial("id").primaryKey(),
  cattleId: integer("cattleId").notNull().references(() => cattle.id),
  
  valuationDate: timestamp("valuationDate").notNull(),
  valuationAmount: integer("valuationAmount").notNull(), // AUD cents
  
  // Valuation Method
  method: methodEnum("method").notNull(),
  
  // Market Data
  marketPrice: integer("marketPrice"), // AUD cents per kg
  weight: integer("weight"), // kg at valuation time
  
  // Comparable Data (for market method)
  comparableBreed: varchar("comparableBreed", { length: 100 }),
  comparableAge: integer("comparableAge"), // months
  comparableLocation: varchar("comparableLocation", { length: 100 }),
  
  // Source
  dataSource: varchar("dataSource", { length: 100 }), // "MLA", "AuctionsPlus", "Manual"
  
  // Confidence
  confidence: confidenceEnum("confidence").default("medium"),
  
  // Metadata
  calculatedBy: varchar("calculatedBy", { length: 100 }), // "system" or user ID
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  cattleIdx: index("valuations_cattle_idx").on(table.cattleId),
  dateIdx: index("valuations_date_idx").on(table.valuationDate),
}));

export type Valuation = typeof valuations.$inferSelect;
export type InsertValuation = typeof valuations.$inferInsert;

// ============================================================================
// MARKET DATA (Simulated MLA Prices)
// ============================================================================

export const marketData = pgTable("marketData", {
  id: serial("id").primaryKey(),
  
  date: timestamp("date").notNull(),
  
  // Cattle Category
  category: varchar("category", { length: 100 }).notNull(), // "Heavy Steer", "Yearling Heifer", etc.
  breed: varchar("breed", { length: 100 }),
  
  // Price Data
  pricePerKg: integer("pricePerKg").notNull(), // AUD cents per kg
  
  // Location
  state: varchar("state", { length: 3 }),
  region: varchar("region", { length: 100 }),
  
  // Source
  source: varchar("source", { length: 100 }).default("MLA").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  dateIdx: index("market_data_date_idx").on(table.date),
  categoryIdx: index("market_data_category_idx").on(table.category),
}));

export type MarketData = typeof marketData.$inferSelect;
export type InsertMarketData = typeof marketData.$inferInsert;

// ============================================================================
// FINANCIAL REPORTS (Cached)
// ============================================================================

export const financialReports = pgTable("financialReports", {
  id: serial("id").primaryKey(),
  
  clientId: integer("clientId").notNull().references(() => clients.id),
  reportType: reportTypeEnum("reportType").notNull(),
  reportDate: timestamp("reportDate").notNull(),
  
  // Report Data (JSON)
  reportData: text("reportData").notNull(), // JSON with complete report
  
  // Summary Metrics
  totalAssets: integer("totalAssets"), // AUD cents
  totalLiabilities: integer("totalLiabilities"), // AUD cents
  netWorth: integer("netWorth"), // AUD cents
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  clientIdx: index("financial_reports_client_idx").on(table.clientId),
  reportTypeIdx: index("financial_reports_report_type_idx").on(table.reportType),
  reportDateIdx: index("financial_reports_report_date_idx").on(table.reportDate),
}));

export type FinancialReport = typeof financialReports.$inferSelect;
export type InsertFinancialReport = typeof financialReports.$inferInsert;

// ============================================================================
// AGRIWEBB SYNC STATUS
// ============================================================================

export const agriwebbSyncStatus = pgTable("agriwebbSyncStatus", {
  id: serial("id").primaryKey(),
  
  clientId: integer("clientId").notNull().references(() => clients.id),
  
  // Sync Status
  syncStatus: syncStatusEnum("syncStatus").default("pending").notNull(),
  lastSyncAttempt: timestamp("lastSyncAttempt"),
  lastSuccessfulSync: timestamp("lastSuccessfulSync"),
  
  // Sync Stats
  animalsCreated: integer("animalsCreated").default(0),
  animalsUpdated: integer("animalsUpdated").default(0),
  animalsSkipped: integer("animalsSkipped").default(0),
  errorCount: integer("errorCount").default(0),
  
  // Error Details
  errorMessage: text("errorMessage"),
  errorDetails: text("errorDetails"), // JSON with detailed errors
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  clientIdx: index("agriwebb_sync_client_idx").on(table.clientId),
  statusIdx: index("agriwebb_sync_status_idx").on(table.syncStatus),
}));

export type AgriwebbSyncStatus = typeof agriwebbSyncStatus.$inferSelect;
export type InsertAgriwebbSyncStatus = typeof agriwebbSyncStatus.$inferInsert;


// ============================================================================
// NOTIFICATIONS
// ============================================================================

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  
  userId: integer("userId").notNull().references(() => users.id),
  
  // Notification Details
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  
  // Related Entity
  cattleId: integer("cattleId").references(() => cattle.id),
  clientId: integer("clientId").references(() => clients.id),
  
  // Status
  isRead: boolean("isRead").default(false).notNull(),
  readAt: timestamp("readAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("notifications_user_idx").on(table.userId),
  typeIdx: index("notifications_type_idx").on(table.type),
  isReadIdx: index("notifications_is_read_idx").on(table.isRead),
}));

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// ============================================================================
// CATTLE EVENTS (Immutable Event Log from TuringCore-v3)
// ============================================================================

export const riskLevelEnum = pgEnum("riskLevel", ["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

export const cattleEvents = pgTable("cattle_events", {
  // Event Identity
  eventId: varchar("event_id", { length: 64 }).primaryKey(),
  eventType: varchar("event_type", { length: 50 }).notNull(),
  eventRef: varchar("event_ref", { length: 255 }).notNull(),
  
  // Subject
  cattleId: integer("cattle_id").notNull(),
  
  // Timestamps
  occurredAt: timestamp("occurred_at").notNull(),
  recordedAt: timestamp("recorded_at").notNull(),
  
  // Idempotency
  idempotencyKey: varchar("idempotency_key", { length: 64 }).unique().notNull(),
  
  // Event Chain
  correlationId: varchar("correlation_id", { length: 64 }),
  causationId: varchar("causation_id", { length: 64 }),
  
  // Source
  sourceSystem: varchar("source_system", { length: 50 }).notNull(),
  schemaVersion: integer("schema_version").notNull(),
  createdBy: varchar("created_by", { length: 100 }),
  
  // Cryptography (Turing Protocol V2)
  publicKey: varchar("public_key", { length: 64 }).notNull(),
  payload: text("payload").notNull(), // JSON
  payloadHash: varchar("payload_hash", { length: 64 }).notNull(),
  signature: varchar("signature", { length: 256 }).notNull(), // Ed25519 signatures can be up to 128 hex chars, doubled for safety
  previousHash: varchar("previous_hash", { length: 64 }),
  merkleRoot: varchar("merkle_root", { length: 64 }),
  
  // Provenance
  confidenceScore: integer("confidence_score"),
  riskLevel: riskLevelEnum("risk_level"),
  
}, (table) => ({
  cattleIdIdx: index("cattle_events_cattle_id_idx").on(table.cattleId),
  occurredAtIdx: index("cattle_events_occurred_at_idx").on(table.occurredAt),
  eventTypeIdx: index("cattle_events_event_type_idx").on(table.eventType),
  idempotencyIdx: index("cattle_events_idempotency_idx").on(table.idempotencyKey),
}));

export type CattleEvent = typeof cattleEvents.$inferSelect;
export type InsertCattleEvent = typeof cattleEvents.$inferInsert;

// ============================================================================
// FRAUD ALERTS (Materialized View from Fraud Detection)
// ============================================================================

export const suspicionTypeEnum = pgEnum("suspicionType", [
  "TAG_SWAP",
  "RAPID_MOVEMENT",
  "PRICE_ANOMALY",
  "MISSING_DOCUMENTATION",
  "DUPLICATE_TAG",
  "CROSS_STATE_NO_PAPERWORK",
  "BELOW_MARKET_PRICE",
  "ABOVE_MARKET_PRICE",
  "GENETIC_MISMATCH",
  "PHOTO_MISMATCH",
  "GPS_ANOMALY",
  "MANUAL_FLAG"
]);

export const severityEnum = pgEnum("severity", ["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

export const fraudAlerts = pgTable("fraud_alerts", {
  id: serial("id").primaryKey(),
  
  // Subject
  cattleId: integer("cattle_id").notNull().references(() => cattle.id),
  eventId: varchar("event_id", { length: 64 }),
  
  // Alert Details
  suspicionType: suspicionTypeEnum("suspicion_type").notNull(),
  severity: severityEnum("severity").notNull(),
  description: text("description"),
  evidence: text("evidence"), // JSON
  
  // Detection
  detectedAt: timestamp("detected_at").notNull(),
  detectedBy: varchar("detected_by", { length: 100 }),
  
  // Resolution
  resolved: boolean("resolved").default(false).notNull(),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by", { length: 100 }),
  resolutionNotes: text("resolution_notes"),
  
}, (table) => ({
  cattleIdIdx: index("fraud_alerts_cattle_id_idx").on(table.cattleId),
  detectedAtIdx: index("fraud_alerts_detected_at_idx").on(table.detectedAt),
  resolvedIdx: index("fraud_alerts_resolved_idx").on(table.resolved),
  severityIdx: index("fraud_alerts_severity_idx").on(table.severity),
}));

export type FraudAlert = typeof fraudAlerts.$inferSelect;
export type InsertFraudAlert = typeof fraudAlerts.$inferInsert;
