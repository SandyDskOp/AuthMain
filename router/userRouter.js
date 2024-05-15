const UserController = require("../controller/authController")
const router = require("express").Router()

router.post("/sign",UserController.signUp)
router.post("/login",UserController.login)
router.get("/protect",UserController.protect,UserController.getAccount)
router.post("/forget",UserController.forgotPassword)
router.patch("/reset/:token",UserController.resetPassword)

module.exports = router