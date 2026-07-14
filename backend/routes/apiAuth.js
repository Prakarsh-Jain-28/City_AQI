const express = require("express")
const { loginCheck, viewOnlyBy } = require("../middleware/auth")
const {
    AuthorityLogin,
    AuthorityRegister,
    AuthorityLogout,
    AuthorityProfile,
    UpdateProfile,
} = require("../controllers/apiAuth")

const router = express.Router();

router.post("/login", AuthorityLogin)

router.post("/register", AuthorityRegister)

router.post("/logout", loginCheck, AuthorityLogout)

router.get("/me", loginCheck, AuthorityProfile)

router.put("/me", loginCheck, UpdateProfile)

module.exports = router;
