const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const app = express();

// home route
app.get("/", async (req, res) => {
  res.send(`Festify API - Home<br/>User Agent: ${req.headers["user-agent"]}`);
});

// serve manifest.json without authentication
app.get("/manifest.json", (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json({
    "short_name": "Festify",
    "name": "Festify: Manage Fests and Events",
    "description": "Festify is a web app that helps you manage your fests and events. It is a one stop solution for all your fest related problems.",
    "icons": [
      {
        "src": "favicon.ico",
        "sizes": "64x64 32x32 24x24 16x16",
        "type": "image/x-icon"
      }
    ],
    "start_url": ".",
    "display": "standalone",
    "theme_color": "#000000",
    "background_color": "#ffffff"
  });
});

// connect to database
require("./database");

// init permissions
const RBACService = require("./src/services/rbac");
RBACService.initPermissions(() => {
  console.log("Permissions initialised");
});

// init feature flags
const FeatureFlagService = require("./src/services/featureFlag");
FeatureFlagService.initFeatureFlags(() => {
  console.log("Feature flags initialised");
});

// cors - More permissive for debugging
const corsOptions = {
  credentials: true,
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:5173",
      "https://fest-frontend-icx7.vercel.app",
      "https://fest-frontend-icx7-ivxkako6s-cieszycs-projects.vercel.app"
    ];
    
    // Add environment variable origins if they exist
    if (process.env.ALLOWED_ORIGINS) {
      allowedOrigins.push(...process.env.ALLOWED_ORIGINS.split(","));
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("CORS blocked origin:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// request logger
app.use((req, res, next) => {
  console.log("Request:", req.method, req.url);
  next();
});

// JSON query middleware
const JSONQueryMiddleware = require("./src/middlewares/json-query");
app.use(JSONQueryMiddleware("q"));

// routes
app.use("/api", require("./src/routes/index.js"));

// error handler
const { handleErrors } = require("./src/utils/errors");
app.use(handleErrors);

// For Vercel serverless functions, export the app directly
module.exports = app;
