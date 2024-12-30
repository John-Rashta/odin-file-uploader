const { Router } = require("express");
const indexController = require("../controllers/indexController");
const indexRouter = Router();

indexRouter.get("/", indexController.showIndex);
indexRouter.get("/signup", indexController.showSignupUser);
indexRouter.post("/signup", indexController.makeSignupUser);
indexRouter.get("/login", indexController.showLoginUser);
indexRouter.post("/login", indexController.makeLoginUser);
indexRouter.get("/logout", indexController.logoutUser);

module.exports = indexRouter;