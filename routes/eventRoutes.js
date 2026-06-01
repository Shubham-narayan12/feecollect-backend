// ==========================================
// routes/eventRoutes.js
// ==========================================

import express from "express";
import {
  createEvent,
  deleteEvent,
  getAllEvent,
  getSingleEvent,
  updateEvent,
} from "../controller/eventsController.js";

const router = express.Router();

router.post("/create-event", createEvent);

router.get("/get-all-event", getAllEvent);

router.get("/get-single-event/:id", getSingleEvent);

router.put("/update-event/:id", updateEvent);

router.delete("/delete-event/:id", deleteEvent);

export default router;
