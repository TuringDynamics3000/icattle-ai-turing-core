ALTER TABLE `users` ADD `xeroAccessToken` text;--> statement-breakpoint
ALTER TABLE `users` ADD `xeroRefreshToken` text;--> statement-breakpoint
ALTER TABLE `users` ADD `xeroTokenExpiresAt` timestamp;