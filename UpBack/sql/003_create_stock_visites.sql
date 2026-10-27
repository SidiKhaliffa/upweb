-- New table owned by UpBack: one row per product counted at a client
-- visit ("Stock client"). StockProduits only keeps the latest count, so
-- without this history nothing tells how fast a client's stock moves.
--   Vendu = StockAvant + Livre - StockCompte, between PrevVisitDate and
--   VisitDate; NULL on a client's first count (nothing to compare with).
CREATE TABLE IF NOT EXISTS `StockVisites` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `ClientId` int NOT NULL,
  `ProduitId` int NOT NULL,
  `VisitDate` datetime(6) NOT NULL,
  `PrevVisitDate` datetime(6) NULL,
  `StockAvant` int NULL,
  `Livre` int NOT NULL DEFAULT 0,
  `StockCompte` int NOT NULL,
  `Vendu` int NULL,
  `CreatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`Id`),
  KEY `IX_StockVisites_Client_Date` (`ClientId`, `VisitDate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
