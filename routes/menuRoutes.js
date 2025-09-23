import express from "express";
import {
  getFoodItems,
  getWeeklyMenu,
  addFoodItem,
  deleteFoodItem,
  clearDayMenu,
  clearDaysMenu
} from "../controllers/menuController.js";

const router = express.Router();

// ✅ CORRECT: GET for reading operations
router.get("/", getFoodItems);
router.get("/weekly", getWeeklyMenu);

// ✅ CORRECT: POST for creating operations
router.post("/", addFoodItem);

// ✅ CORRECT: DELETE for deleting operations
router.delete("/:id", deleteFoodItem);
router.delete("/clear/day", clearDayMenu); // Using query parameter ?day=Monday
router.delete("/clear/days", clearDaysMenu); // Using query parameter ?days=Monday,Tuesday

export default router;