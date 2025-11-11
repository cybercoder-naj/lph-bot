CREATE TABLE `championship` (
	`id` integer,
	`name` text,
	`community` text,
	`image` text,
	`game` text,
	`registration` text,
	`dates` text,
	`rounds` text
);
--> statement-breakpoint
CREATE TABLE `race` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`date` text NOT NULL,
	`track` text NOT NULL,
	`imageLink` text,
	`championshipId` integer NOT NULL,
	FOREIGN KEY (`championshipId`) REFERENCES `championship`(`id`) ON UPDATE no action ON DELETE no action
);
