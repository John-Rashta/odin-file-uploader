const { Router } = require("express");
const storageController = require("../controllers/storageController");
const storageRouter = Router();

storageRouter.get("/upload", storageController.showUpload);
storageRouter.post("/upload", storageController.makeUpload);
storageRouter.post("/delete/:fileid", storageController.deleteFile);
storageRouter.get("/file/:fileid", storageController.showFileDetails);


module.exports = storageRouter;