import "dotenv/config";
import express from "express";
import cors from "cors";

import { errorHandler } from "./middleware/errorHandler.js";
import userRoutes from "./routes/user.routes.js";
import stockRoutes from "./routes/stock.routes.js";
import commandRoutes from "./routes/command.routes.js";
import clientsRoutes from "./routes/clients.routes.js";
import historiqueRoutes from "./routes/historique.routes.js";
import factureRoutes from "./routes/facture.routes.js";
import commercesRoutes from "./routes/commerces.routes.js";
import statistiqueRoutes from "./routes/statistique.routes.js";
import peintresRoutes from "./routes/peintres.routes.js";
import accueilRoutes from "./routes/accueil.routes.js";

const app = express();

// Content-Disposition is exposed so UpFront can save PDFs under the name
// the server gives them.
app.use(cors({ exposedHeaders: ["Content-Disposition"] }));
// strict: false because UpFront posts the refresh token to
// /api/User/refresh as a bare JSON string, which strict mode rejects.
app.use(express.json({ strict: false }));

// Mounted to mirror the .NET backend's exact path casing
// (api.universellepeinture.com/api/<Resource>/...), so UpFront's fetch
// calls don't need any changes.
app.use("/api/User", userRoutes);
app.use("/api/Stock", stockRoutes);
app.use("/api/Command", commandRoutes);
app.use("/api/Clients", clientsRoutes);
app.use("/api/Historique", historiqueRoutes);
app.use("/api/Facture", factureRoutes);
app.use("/api/Commerces", commercesRoutes);
app.use("/api/Statistique", statistiqueRoutes);
app.use("/api/Peintres", peintresRoutes);
app.use("/api/Accueil", accueilRoutes);

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use(errorHandler);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`UpBack listening on port ${port}`);
});
