// app.js
const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const cors = require("cors");

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: process.env.CLIENT_URL, 
    credentials: true
}));

// Route Imports
const user = require("./routes/userRoute");
const product = require("./routes/productRoute");
const order = require("./routes/orderRoute");
const notification = require("./routes/notificationRoute");

// Mount Routes
app.use("/api/v1", user);
app.use("/api/v1", product);
app.use("/api/v1", order);
app.use("/api/v1", notification);

module.exports = app;