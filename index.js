const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sequelize = require("./config/db.js");
const dotenv = require('dotenv').config()

const allowedOrigins = [
    'https://cmkl.koelsmartenergy.com:8081', // Production frontend
    'https://cmkl.koelsmartenergy.com:8081'
  ];
  
  const corsOptions = {
    origin: (origin, callback) => {
      //console.log('Request Origin:', origin); // Debugging
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // Allow cookies/auth headers if needed
  };
  
const overviewRoutes = require('./src/overview/overview_routes.js');
const solarRoutes = require('./src/solar/solar_routes.js');
const mainsRoutes = require('./src/mains/mains_routes.js');
const gensetRoutes = require('./src/genset/genset_routes.js');
const alertRoutes = require('./src/alert/alert_routes.js');

const app = express();
const PORT = 5001 || process.env.PORT;

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.use(cors(corsOptions))
app.use(cors())
app.use('/micro/overview', overviewRoutes);
app.use('/micro/solar', solarRoutes);
app.use('/micro/mains', mainsRoutes);
app.use('/micro/genset', gensetRoutes);
app.use('/micro/alert', alertRoutes);

app.get('/micro', (req,res) => res.send('Hello User'));

app.listen(PORT, () => console.log(`Server Running on port: http://localhost:${PORT}`));