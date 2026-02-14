const express = require("express");
const { createAccount, login, getUser } = require("../controllers/user.controller");
const { authenticationToken } = require("../utilities");
const { validate, schemas } = require("../middleware/validation");

const router = express.Router();

router.post("/create-user", validate(schemas.register), createAccount);
router.post("/login", validate(schemas.login), login);
router.get("/get-user", authenticationToken, getUser);

module.exports = router;
