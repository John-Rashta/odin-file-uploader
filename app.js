const express = require("express");
const app = express();
const path = require("node:path");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require('passport-local').Strategy;
const indexRouter = require("./routes/indexRouter");
const storageRouter = require("./routes/storageRouter");
const folderRouter = require("./routes/folderRouter");
const shareRouter = require("./routes/shareRouter");
require("dotenv").config();
const { PrismaSessionStore } = require('@quixo3/prisma-session-store');
const { PrismaClient } = require('@prisma/client');

app.use(express.urlencoded({ extended: true }));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(session({
  secret: process.env.SECRET, 
  resave: true, 
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24
  },
  store: new PrismaSessionStore(
    new PrismaClient(),
    {
      checkPeriod: 2 * 60 * 1000,  //ms
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }
  )
}));

require('./config/passport');

app.use(passport.initialize());
app.use(passport.session());

app.use("/", indexRouter);
app.use("/storage", storageRouter);
app.use("/folder", folderRouter);
app.use("/share", shareRouter);


app.use((err, req, res, next) => {
    console.error(err);
    // We can now specify the `err.statusCode` that exists in our custom error class and if it does not exist it's probably an internal server error
    res.status(err.statusCode || 500).send(err.message);
  });
  
app.listen(8080);