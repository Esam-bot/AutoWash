const express = require('express')
const { Client } = require('pg')
const cors = require('cors')
const path = require('path')
const vehicleRoutes = require('./routes/vehicleRoutes')
const userRoutes = require('./routes/usersRoutes')

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, 'frontend')))

const sessions = new Map() //keep track of tokens

// Authentication middleware
function requireAuth(req, res, next) {
    console.log('Authorization header:', req.headers.authorization);
    
    const authHeader = req.headers.authorization;
    
    let token;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
    } else {
        token = authHeader;
    }
    
    console.log('Extracted token:', token);
    
    if (token && sessions.has(token)) {
        req.user = sessions.get(token);
        next();
    } else {
        res.status(401).json({ message: 'Unauthorized. Please login.' });
    }
}

const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'Autowash',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || 'april2004'
})

client.connect()
    .then(() => {
        console.log('✅ PostgreSQL CONNECTED successfully to database: PROJECT')
        return client.query(`
             CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                email VARCHAR(100) UNIQUE,
                role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'employee', 'user')),
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
           
        `);
    })
    .then(() => {
        console.log('✅ users table ready');
        return client.query(`
             CREATE TABLE IF NOT EXISTS vehicles (
                id SERIAL PRIMARY KEY,
                vehicle VARCHAR(20) NOT NULL CHECK (vehicle IN ('Car','Bike','Truck')),
                number_plate VARCHAR(20) NOT NULL UNIQUE,
                ENTEREDBYUSER INTEGER NOT NULL,
                assigned_lane INTEGER NOT NULL CHECK (assigned_lane IN (1, 2, 3)),
                price VARCHAR(50) NOT NULL CHECK (price IN ('500PKR for Car', '300PKR for Bike', '800PKR for Truck')),
                wash_time VARCHAR(50) NOT NULL CHECK (wash_time IN ('15Min for Car', '10Min for Bike', '20Min for Truck')),
                token VARCHAR(50) NOT NULL UNIQUE,
                status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
                wash_start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                estimated_completion_time TIMESTAMP,
                completed_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (ENTEREDBYUSER) REFERENCES users(id) 
            )
        `);
    })
    .then(() => {
        console.log('✅ Users table ready');
        
        // Start auto-completion service for vehicles
        setInterval(() => {
            try {
                vehicleController.checkAndUpdateCompletedVehicles();
            } catch (error) {
                console.log('❌ Auto-completion check failed:', error.message);
            }
        }, 30000);
        
        console.log('✅ Auto-completion service started');
        
        return client.query('SELECT version()');
    })
    .then((result) => {
        console.log('PostgreSQL version:', result.rows[0].version);
    })
    .catch((error) => {
        console.log('❌ Error Connecting to PostgreSQL:', error.message);
    })

// Make the client and sessions available to your routes
app.set('dbClient', client)
app.set('sessions', sessions) // Make sessions available to controllers

// Import controllers
const vehicleController = require('./controllers/vehicleController');
const userController = require('./controllers/users');

// Set clients for controllers
vehicleController.setClient(client);
userController.setClient(client); // Set client for user controller

// API Routes

// ✅ FIXED: Remove duplicate login route - only use userRoutes
// User routes (public - no authentication required for register/login)
app.use('/api/users', userRoutes);

// Vehicle routes with authentication
app.use('/api/vehicles', requireAuth, vehicleRoutes)

// Logout endpoint
app.post('/api/logout', requireAuth, (req, res) => {
    const token = req.headers.authorization;
    
    let actualToken;
    if (token && token.startsWith('Bearer ')) {
        actualToken = token.substring(7);
    } else {
        actualToken = token;
    }
    
    sessions.delete(actualToken);
    res.json({ success: true, message: 'Logged out successfully' });
});

// HTML Routes - Serve the main pages
// Add this to your index.js in the HTML Routes section:
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'register.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'login.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'hello.html'));
});

// Health check route
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Catch-all route - serve login page for any other route
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'login.html'));
});

// Export the app for Vercel
module.exports = app;

// For local development
if (require.main === module) {
    const PORT = process.env.PORT || 9000;
    app.listen(PORT, () => {
        console.log('🚀 Server running on port', PORT);
        console.log('📍 Local URL: http://localhost:' + PORT);
        console.log('📍 Dashboard: http://localhost:' + PORT + '/dashboard');
        console.log('📍 Health Check: http://localhost:' + PORT + '/api/health');
        console.log('📍 User Register: http://localhost:' + PORT + '/api/users/register');
        console.log('📍 User Login: http://localhost:' + PORT + '/api/users/login');
        console.log('📍 Vehicle API: http://localhost:' + PORT + '/api/vehicles/wash');
    });
}