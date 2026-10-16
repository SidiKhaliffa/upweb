-- New table owned by UpBack (not part of the .NET backend's EF migrations).
-- Engine/charset/collation match the existing tables.
-- Telephone is unique so the same painter can't be added twice.
CREATE TABLE IF NOT EXISTS `Peintres` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Nom` varchar(255) NOT NULL,
  `Telephone` varchar(50) NOT NULL,
  `CreatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`Id`),
  UNIQUE KEY `UX_Peintres_Telephone` (`Telephone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
