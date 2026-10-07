const mongoose = require("mongoose");
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/nook")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));
