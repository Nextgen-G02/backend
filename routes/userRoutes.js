import express from 'express';
import { registerUser } from '../Controllers/userController';

const userRouter = express.Router();

userRouter.post("/register", registerUser);