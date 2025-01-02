const { Router } = require("express");
const shareController = require("../controllers/shareController");
const shareRouter = Router();

shareRouter.get("/:code", shareController.showSharedFolder);
shareRouter.get("/:code/:fileid", shareController.showSharedFile);

module.exports = shareRouter;