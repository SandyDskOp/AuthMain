const Users = require("../model/userModel");
const jwt = require("jsonwebtoken");
const { model } = require("mongoose");
require("dotenv").config;
const { promisify } = require("util");
const { sendMail } = require("../Middlewares/email");

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES,
  });
};

const verifyToken = async (token) => {
  return await promisify(jwt.verify)(token, process.env.JWT_SECREt);
};

const signUp = async (req, res) => {
  let newUser;
  let savedUser;
  try {
    newUser = new Users({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      confirm: req.body.confirm,
      passwordChangedAt: req.body.passwordChangedAt,
    });
    savedUser = await newUser.save();
  } catch (err) {
    console.log(err);
  }
  if (!savedUser) {
    return res
      .status(404)
      .json({ status: "success", message: "Error saving data" });
  } else {
    const token = signToken(savedUser._id);
    return res.status(201).json({ status: "sucess", data: token });
  }
};

const login = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ status: "fail", message: "Please provide email and password" });
  }

  let user;
  try {
    user = await Users.findOne({ email: email }).select("+password");
  } catch (err) {
    console.log(err);
    return res.status(500).json({ status: "error", message: "Server error" });
  }

  if (!user) {
    return res
      .status(400)
      .json({ status: "failure", message: "Email is not found" });
  }

  let correctPassword;
  try {
    correctPassword = await user.correctPassword(password, user.password);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ status: "error", message: "Server error" });
  }

  if (!correctPassword) {
    return res
      .status(401)
      .json({ status: "failure", message: "Incorrect password" });
  }
  const token = signToken(user._id);
  return res.status(200).json({ status: "success", data: token });
};

const protect = async (req, res, next) => {
  let header = req.header("Authorization");
  let token;
  if (!header) {
    return res
      .status(404)
      .json({ status: "failure", message: "No token found" });
  }
  if (!header.startsWith("Bearer")) {
    return res
      .status(404)
      .json({ status: "failure", message: "Invalid token credentials" });
  }
  token = header.split(" ")[1];
  if (!token) {
    return res
      .status(404)
      .json({ status: "failure", message: "You are not Logged in" });
  }
  let user;
  try {
    user = await verifyToken(token);
  } catch (err) {
    console.log(err);
  }
  if (!user) {
    return res.status(402).json({
      status: "failure",
      message: "The token is invalid or might be expired",
    });
  }
  req.user = user;
  next();
};

const getAccount = async (req, res, next) => {
  const { id, iat } = req.user;
  let account;
  let validToken;

  try {
    account = await Users.findById(id);
  } catch (err) {
    console.log(err);
  }
  if (!account) {
    return res.status(403).json({
      status: "failure",
      message:
        "Cannot fetch user right now or user might have deleted the account",
    });
  }
  try {
    validToken = account.changedPasswordAfter(iat);
  } catch (err) {
    console.log(err);
  }
  if (validToken) {
    return res.status(402).json({
      status: "failure",
      message: "User recently changed password! please login again",
    });
  }
  return res.status(200).json({ status: "success", data: account });
};

const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  let exist;
  try {
    exist = await Users.findOne({ email: email });
  } catch (err) {
    console.log(err);
  }
  if (!exist) {
    return res
      .status(404)
      .json({ status: "failure", message: "The email id not exists" });
  }
  let passwordToken;
  try {
    passwordToken = exist.createPasswordResetToken();
  } catch (err) {
    console.log(err);
  }
  if (!passwordToken) {
    return res
      .status(404)
      .json({ status: "failure", message: "Cannot generate token" });
  }
  await exist.save({ validateBeforeSave: false });
  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/user/reset/${passwordToken}`;
  const options = {
    email: email,
    subject: "Password reset Link",
    message: resetUrl,
  };
  try {
    await sendMail(options);
    return res
      .status(200)
      .json({ status: "success", message: "Token sent to your email" });
  } catch (err) {
    exist.passwordResetToken = undefined;
    exist.passwordResetExpires = undefined;
    await exist.save({ validateBeforeSave: false });
    return res.status(404).json({ status: "failure", message: "There was an error sending rest link please try again later" });
  }
};

const resetPassword = async (req, res, next) => {
    const token = req.params.token
    return res.status(200).json({status:"success",data:token})
};

module.exports = {
  signUp,
  login,
  protect,
  getAccount,
  forgotPassword,
  resetPassword,
};
