const { Router } = require("express");
const storageController = require("../controllers/storageController");
const storageRouter = Router();

storageRouter.get("/upload", storageController.showUpload);
storageRouter.post("/upload", storageController.makeUpload);

module.exports = storageRouter;