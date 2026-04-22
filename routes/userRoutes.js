import express from 'express';
import { createStaff, loginUser, registerUser, getAllStaff, deleteUser } from '../Controllers/userController.js';
import { auth } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/create-staff", auth, authorizeRoles("admin"), createStaff); 
userRouter.get("/staff", auth, authorizeRoles("admin"), getAllStaff);
userRouter.delete("/:id", auth, authorizeRoles("admin"), deleteUser);

export default userRouter;