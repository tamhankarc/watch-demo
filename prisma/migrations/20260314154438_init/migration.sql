-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'MANAGER', 'SALES_EXECUTIVE') NOT NULL,
    `phone` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Customer` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `salesExecutiveId` INTEGER NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `customerTier` VARCHAR(191) NULL,
    `remarks` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Customer_salesExecutiveId_idx`(`salesExecutiveId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CustomerNote` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customerId` INTEGER NOT NULL,
    `createdByUserId` INTEGER NOT NULL,
    `note` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CustomerNote_customerId_idx`(`customerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Brand` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `externalId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Brand_name_key`(`name`),
    UNIQUE INDEX `Brand_slug_key`(`slug`),
    UNIQUE INDEX `Brand_externalId_key`(`externalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Model` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `brandId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `collectionName` VARCHAR(191) NULL,
    `genderCategory` VARCHAR(191) NULL,
    `externalId` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Model_externalId_key`(`externalId`),
    INDEX `Model_brandId_idx`(`brandId`),
    UNIQUE INDEX `Model_brandId_name_key`(`brandId`, `name`),
    UNIQUE INDEX `Model_brandId_slug_key`(`brandId`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WatchReference` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `brandId` INTEGER NOT NULL,
    `modelId` INTEGER NOT NULL,
    `referenceNumber` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NOT NULL,
    `description` LONGTEXT NULL,
    `movement` VARCHAR(191) NULL,
    `caseMaterial` VARCHAR(191) NULL,
    `dialColor` VARCHAR(191) NULL,
    `braceletMaterial` VARCHAR(191) NULL,
    `caseSizeMm` DECIMAL(8, 2) NULL,
    `waterResistanceM` INTEGER NULL,
    `productionYearStart` INTEGER NULL,
    `productionYearEnd` INTEGER NULL,
    `msrpUsd` DECIMAL(12, 2) NULL,
    `currencyCode` VARCHAR(191) NULL,
    `imageUrl` VARCHAR(191) NULL,
    `externalId` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastSyncedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `WatchReference_externalId_key`(`externalId`),
    INDEX `WatchReference_brandId_idx`(`brandId`),
    INDEX `WatchReference_modelId_idx`(`modelId`),
    UNIQUE INDEX `WatchReference_modelId_referenceNumber_key`(`modelId`, `referenceNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WatchReferenceSpec` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `watchReferenceId` INTEGER NOT NULL,
    `specKey` VARCHAR(191) NOT NULL,
    `specValue` TEXT NOT NULL,

    INDEX `WatchReferenceSpec_watchReferenceId_idx`(`watchReferenceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StockItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `brandId` INTEGER NOT NULL,
    `modelId` INTEGER NOT NULL,
    `watchReferenceId` INTEGER NULL,
    `serialNumber` VARCHAR(191) NOT NULL,
    `storeSku` VARCHAR(191) NULL,
    `dateReceived` DATETIME(3) NULL,
    `purchaseCost` DECIMAL(12, 2) NULL,
    `currentStatus` ENUM('AVAILABLE', 'ASSIGNED', 'SOLD', 'CANCELLED', 'HOLD_EXPIRED') NOT NULL DEFAULT 'AVAILABLE',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `StockItem_serialNumber_key`(`serialNumber`),
    INDEX `StockItem_brandId_idx`(`brandId`),
    INDEX `StockItem_modelId_idx`(`modelId`),
    INDEX `StockItem_watchReferenceId_idx`(`watchReferenceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Requirement` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customerId` INTEGER NOT NULL,
    `salesExecutiveId` INTEGER NOT NULL,
    `brandId` INTEGER NOT NULL,
    `modelId` INTEGER NULL,
    `watchReferenceId` INTEGER NULL,
    `priorityRank` INTEGER NULL,
    `status` ENUM('WAITING', 'ASSIGNED', 'SOLD', 'CANCELLED') NOT NULL DEFAULT 'WAITING',
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Requirement_customerId_idx`(`customerId`),
    INDEX `Requirement_salesExecutiveId_idx`(`salesExecutiveId`),
    INDEX `Requirement_brandId_idx`(`brandId`),
    INDEX `Requirement_modelId_idx`(`modelId`),
    INDEX `Requirement_watchReferenceId_idx`(`watchReferenceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Allocation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `requirementId` INTEGER NOT NULL,
    `customerId` INTEGER NOT NULL,
    `stockItemId` INTEGER NOT NULL,
    `assignedByUserId` INTEGER NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `status` ENUM('ACTIVE', 'SOLD', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    `remarks` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Allocation_status_expiresAt_idx`(`status`, `expiresAt`),
    INDEX `Allocation_requirementId_idx`(`requirementId`),
    INDEX `Allocation_customerId_idx`(`customerId`),
    INDEX `Allocation_stockItemId_idx`(`stockItemId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CatalogSyncRun` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sourceCode` VARCHAR(191) NOT NULL,
    `runType` VARCHAR(191) NOT NULL,
    `status` ENUM('STARTED', 'SUCCESS', 'FAILED', 'PARTIAL') NOT NULL,
    `startedAt` DATETIME(3) NOT NULL,
    `endedAt` DATETIME(3) NULL,
    `summaryJson` JSON NULL,
    `errorLog` LONGTEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Customer` ADD CONSTRAINT `Customer_salesExecutiveId_fkey` FOREIGN KEY (`salesExecutiveId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CustomerNote` ADD CONSTRAINT `CustomerNote_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CustomerNote` ADD CONSTRAINT `CustomerNote_createdByUserId_fkey` FOREIGN KEY (`createdByUserId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Model` ADD CONSTRAINT `Model_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `Brand`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WatchReference` ADD CONSTRAINT `WatchReference_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `Brand`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WatchReference` ADD CONSTRAINT `WatchReference_modelId_fkey` FOREIGN KEY (`modelId`) REFERENCES `Model`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WatchReferenceSpec` ADD CONSTRAINT `WatchReferenceSpec_watchReferenceId_fkey` FOREIGN KEY (`watchReferenceId`) REFERENCES `WatchReference`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockItem` ADD CONSTRAINT `StockItem_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `Brand`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockItem` ADD CONSTRAINT `StockItem_modelId_fkey` FOREIGN KEY (`modelId`) REFERENCES `Model`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockItem` ADD CONSTRAINT `StockItem_watchReferenceId_fkey` FOREIGN KEY (`watchReferenceId`) REFERENCES `WatchReference`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Requirement` ADD CONSTRAINT `Requirement_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Requirement` ADD CONSTRAINT `Requirement_salesExecutiveId_fkey` FOREIGN KEY (`salesExecutiveId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Requirement` ADD CONSTRAINT `Requirement_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `Brand`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Requirement` ADD CONSTRAINT `Requirement_modelId_fkey` FOREIGN KEY (`modelId`) REFERENCES `Model`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Requirement` ADD CONSTRAINT `Requirement_watchReferenceId_fkey` FOREIGN KEY (`watchReferenceId`) REFERENCES `WatchReference`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Allocation` ADD CONSTRAINT `Allocation_requirementId_fkey` FOREIGN KEY (`requirementId`) REFERENCES `Requirement`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Allocation` ADD CONSTRAINT `Allocation_stockItemId_fkey` FOREIGN KEY (`stockItemId`) REFERENCES `StockItem`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Allocation` ADD CONSTRAINT `Allocation_assignedByUserId_fkey` FOREIGN KEY (`assignedByUserId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
