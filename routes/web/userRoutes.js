import express from 'express';
import { createStaff, loginUser, registerUser, getAllStaff, deleteUser, updateUser, googleLogin, verifyOTP, resendOTP, forgotPassword, resetPassword } from '../../Controllers/web/userController.js';
import { auth } from '../../middleware/authMiddleware.js';
import { authorizeRoles } from '../../middleware/roleMiddleware.js';

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/verify-otp", verifyOTP);
userRouter.post("/resend-otp", resendOTP);
userRouter.post("/login", loginUser);
userRouter.post("/forgot-password", forgotPassword);
userRouter.post("/reset-password", resetPassword);
userRouter.post("/google-login", googleLogin);
userRouter.post("/create-staff", auth, authorizeRoles("admin"), createStaff); 
userRouter.get("/staff", auth, authorizeRoles("admin"), getAllStaff);
userRouter.put("/:id", auth, authorizeRoles("admin"), updateUser);
userRouter.delete("/:id", auth, authorizeRoles("admin"), deleteUser);

export default userRouter;