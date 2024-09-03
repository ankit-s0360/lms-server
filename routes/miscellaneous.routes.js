import { Router } from "express";
import { contactFormController, getAllUsers } from "../controllers/miscellaneous.controller.js";
import { authorizedRoles } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/contact", contactFormController);
router.get("/stats/users", getAllUsers);

export default router;
