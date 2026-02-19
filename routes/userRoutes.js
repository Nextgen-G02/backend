import express from 'express';
import { createStaff, loginUser, registerUser } from '../Controllers/userController.js';
import { auth } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/create-staff", auth, authorizeRoles("admin"), createStaff); // auth cheks wheather they are logged in 

export default userRouter;