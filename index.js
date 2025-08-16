const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');
const routes = require('./src/routes/index');

const app = express();

app.use(cors());
app.use(express.json());
connectDB();


app.use('/api', routes);

 app.listen(process.env.PORT || 5000, () =>
      console.log(`Server running on port ${process.env.PORT || 5000}`)
    );


