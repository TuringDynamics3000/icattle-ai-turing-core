CREATE TABLE `agriwebbSyncStatus` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`syncStatus` enum('pending','in_progress','completed','failed') NOT NULL DEFAULT 'pending',
	`lastSyncAttempt` timestamp,
	`lastSuccessfulSync` timestamp,
	`animalsCreated` int DEFAULT 0,
	`animalsUpdated` int DEFAULT 0,
	`animalsSkipped` int DEFAULT 0,
	`errorCount` int DEFAULT 0,
	`errorMessage` text,
	`errorDetails` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agriwebbSyncStatus_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `clients` MODIFY COLUMN `status` enum('active','inactive','suspended') NOT NULL DEFAULT 'active';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','farmer','bank','investor') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `cattle` ADD `agriwebbId` varchar(255);--> statement-breakpoint
ALTER TABLE `clients` ADD `agriwebbFarmId` varchar(255);--> statement-breakpoint
ALTER TABLE `clients` ADD `agriwebbConnected` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `clients` ADD `agriwebbLastSync` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `viewPreference` varchar(50);--> statement-breakpoint
ALTER TABLE `agriwebbSyncStatus` ADD CONSTRAINT `agriwebbSyncStatus_clientId_clients_id_fk` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `client_idx` ON `agriwebbSyncStatus` (`clientId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `agriwebbSyncStatus` (`syncStatus`);