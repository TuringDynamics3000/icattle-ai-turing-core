CREATE TABLE `cattle` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nlisId` varchar(16),
	`visualId` varchar(50),
	`biometricId` varchar(64),
	`breed` varchar(100) NOT NULL,
	`sex` enum('bull','steer','cow','heifer','calf') NOT NULL,
	`dateOfBirth` timestamp,
	`clientId` int NOT NULL,
	`currentLocation` varchar(255),
	`currentWeight` int,
	`lastWeighDate` timestamp,
	`color` varchar(100),
	`cattleType` enum('beef','dairy','breeding','feeder') NOT NULL,
	`grade` varchar(50),
	`sireId` int,
	`damId` int,
	`pedigreeDetails` text,
	`healthStatus` enum('healthy','sick','quarantine','deceased') NOT NULL DEFAULT 'healthy',
	`lastHealthCheck` timestamp,
	`currentValuation` int,
	`lastValuationDate` timestamp,
	`acquisitionCost` int,
	`acquisitionDate` timestamp,
	`status` enum('active','sold','deceased','transferred') NOT NULL DEFAULT 'active',
	`imageUrl` varchar(500),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cattle_id` PRIMARY KEY(`id`),
	CONSTRAINT `cattle_nlisId_unique` UNIQUE(`nlisId`),
	CONSTRAINT `cattle_biometricId_unique` UNIQUE(`biometricId`)
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`abn` varchar(11),
	`contactName` varchar(255),
	`contactEmail` varchar(320),
	`contactPhone` varchar(20),
	`address` text,
	`state` varchar(3),
	`postcode` varchar(4),
	`propertySize` int,
	`clientType` enum('producer','feedlot','breeder','dairy') NOT NULL,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `financialReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`reportType` enum('balance_sheet','profit_loss','portfolio_summary') NOT NULL,
	`reportDate` timestamp NOT NULL,
	`reportData` text NOT NULL,
	`totalAssets` int,
	`totalLiabilities` int,
	`netWorth` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `financialReports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lifecycleEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cattleId` int NOT NULL,
	`eventType` enum('birth','acquisition','weight_update','health_check','vaccination','treatment','movement','grading','breeding','calving','sale','death','transfer') NOT NULL,
	`eventDate` timestamp NOT NULL,
	`details` text NOT NULL,
	`weight` int,
	`fromLocation` varchar(255),
	`toLocation` varchar(255),
	`healthStatus` varchar(100),
	`veterinarian` varchar(255),
	`amount` int,
	`recordedBy` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lifecycleEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `marketData` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` timestamp NOT NULL,
	`category` varchar(100) NOT NULL,
	`breed` varchar(100),
	`pricePerKg` int NOT NULL,
	`state` varchar(3),
	`region` varchar(100),
	`source` varchar(100) NOT NULL DEFAULT 'MLA',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `marketData_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `valuations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cattleId` int NOT NULL,
	`valuationDate` timestamp NOT NULL,
	`valuationAmount` int NOT NULL,
	`method` enum('market','weight','breeding','comparable') NOT NULL,
	`marketPrice` int,
	`weight` int,
	`comparableBreed` varchar(100),
	`comparableAge` int,
	`comparableLocation` varchar(100),
	`dataSource` varchar(100),
	`confidence` enum('high','medium','low') DEFAULT 'medium',
	`calculatedBy` varchar(100),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `valuations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `cattle` ADD CONSTRAINT `cattle_clientId_clients_id_fk` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `financialReports` ADD CONSTRAINT `financialReports_clientId_clients_id_fk` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lifecycleEvents` ADD CONSTRAINT `lifecycleEvents_cattleId_cattle_id_fk` FOREIGN KEY (`cattleId`) REFERENCES `cattle`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lifecycleEvents` ADD CONSTRAINT `lifecycleEvents_recordedBy_users_id_fk` FOREIGN KEY (`recordedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `valuations` ADD CONSTRAINT `valuations_cattleId_cattle_id_fk` FOREIGN KEY (`cattleId`) REFERENCES `cattle`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `client_idx` ON `cattle` (`clientId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `cattle` (`status`);--> statement-breakpoint
CREATE INDEX `breed_idx` ON `cattle` (`breed`);--> statement-breakpoint
CREATE INDEX `client_idx` ON `financialReports` (`clientId`);--> statement-breakpoint
CREATE INDEX `report_type_idx` ON `financialReports` (`reportType`);--> statement-breakpoint
CREATE INDEX `report_date_idx` ON `financialReports` (`reportDate`);--> statement-breakpoint
CREATE INDEX `cattle_idx` ON `lifecycleEvents` (`cattleId`);--> statement-breakpoint
CREATE INDEX `event_type_idx` ON `lifecycleEvents` (`eventType`);--> statement-breakpoint
CREATE INDEX `event_date_idx` ON `lifecycleEvents` (`eventDate`);--> statement-breakpoint
CREATE INDEX `date_idx` ON `marketData` (`date`);--> statement-breakpoint
CREATE INDEX `category_idx` ON `marketData` (`category`);--> statement-breakpoint
CREATE INDEX `cattle_idx` ON `valuations` (`cattleId`);--> statement-breakpoint
CREATE INDEX `date_idx` ON `valuations` (`valuationDate`);