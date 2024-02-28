import express, { Request, Response } from "express";
import User from "../models/user";
import jwt from "jsonwebtoken";
import { check, validationResult } from "express-validator";

const router = express.Router();

//! /api/users/register
router.post(
  "/register",
  [
    check("firstName", "First Name is required").notEmpty().trim().matches(/^\S+$/).isString(),
    check("lastName", "Last Name is required").notEmpty().trim().matches(/^\S+$/).isString(),
    check("email", "Email is required").isEmail(),
    check("password", "Password with 6 or more characters required").trim().matches(/^\S+$/).isLength({
      min: 6,
    }),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ msg: errors.array() });
    }
    try {
      let user = await User.findOne({
        email: req.body.email,
      });
      if (user) {
        res.status(400).json({ msg: "User already exists" });
      }
      user = new User(req.body);
      await user.save();

      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET_KEY as string,
        {
          expiresIn: "3d",
        }
      );
      res.cookie("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 86400 * 1000 * 3,
      });
      return res.status(200).json({ msg: "User created successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: "Something went wrong" });
    }
  }
);

export default router;