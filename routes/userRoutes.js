import express from 'express';
import { createStaff, loginUser, registerUser, googleLogin } from '../Controllers/userController.js';
import { auth } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/google-login", googleLogin);
userRouter.post("/create-staff", auth, authorizeRoles("admin"), createStaff); // auth cheks wheather they are logged in 

export default userRouter;