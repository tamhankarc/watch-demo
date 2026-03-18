-- DropForeignKey
ALTER TABLE `WatchReference` DROP FOREIGN KEY `WatchReference_modelId_fkey`;

-- AlterTable
ALTER TABLE `WatchReference` MODIFY `modelId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `WatchReference` ADD CONSTRAINT `WatchReference_modelId_fkey` FOREIGN KEY (`modelId`) REFERENCES `Model`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
