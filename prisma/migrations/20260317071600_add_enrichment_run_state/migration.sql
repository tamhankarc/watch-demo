-- CreateTable
CREATE TABLE `EnrichmentRunState` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `jobName` VARCHAR(191) NOT NULL,
    `lastReferenceId` INTEGER NULL,
    `dailyQuota` INTEGER NOT NULL DEFAULT 180,
    `usedToday` INTEGER NOT NULL DEFAULT 0,
    `quotaDate` DATETIME(3) NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `EnrichmentRunState_jobName_key`(`jobName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
