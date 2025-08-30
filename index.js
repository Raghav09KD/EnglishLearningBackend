const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');
const routes = require('./src/routes/index');

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", routes);

// Connect DB then start server
const startServer = async () => {
  try {
    await connectDB();
    console.log("✅ Database connected");


    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Database connection failed:", err);
    process.exit(1); // Exit process if DB connection fails
  }
};

startServer();



