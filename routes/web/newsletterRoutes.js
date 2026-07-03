import express from "express";
import { subscribe, getSubscribers, addSubscriber, deleteSubscriber, broadcastNewsletter, getHistory } from "../../Controllers/web/newsletterController.js";
import { auth } from "../../middleware/authMiddleware.js";
import { authorizeRoles } from "../../middleware/roleMiddleware.js";

const newsletterRoutes = express.Router();

// Public route
newsletterRoutes.post("/subscribe", subscribe);

// Admin routes
newsletterRoutes.get("/", auth, authorizeRoles("admin", "staff"), getSubscribers);
newsletterRoutes.get("/history", auth, authorizeRoles("admin", "staff"), getHistory);
newsletterRoutes.post("/add", auth, authorizeRoles("admin", "staff"), addSubscriber);
newsletterRoutes.post("/broadcast", auth, authorizeRoles("admin", "staff"), broadcastNewsletter);
newsletterRoutes.delete("/:id", auth, authorizeRoles("admin", "staff"), deleteSubscriber);

export default newsletterRoutes;
