const express = require('express')
const { Client } = require('pg')
const cors = require('cors')
const path = require('path')
const vehicleRoutes = require('./routes/vehicleRoutes') //


const app = express()

// Middleware
app.use(cors())
app.use(express.json())

app.use(cors({
  origin: true, // Allow all origins in production
  credentials: true
}));

// Handle preflight for all routes
app.options('*', cors());


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
        // Create vehicles table if it doesn't exist
        return client.query(`
            CREATE TABLE IF NOT EXISTS vehicles (
                id SERIAL PRIMARY KEY,
                vehicle VARCHAR(20) NOT NULL CHECK (vehicle IN ('Car','Bike','Truck')),
                number_plate VARCHAR(20) NOT NULL UNIQUE,
                assigned_lane INTEGER NOT NULL CHECK (assigned_lane IN (1, 2, 3)),
                price VARCHAR(50) NOT NULL CHECK (price IN ('500PKR for Car', '300PKR for Bike', '800PKR for Truck')),
                wash_time VARCHAR(50) NOT NULL CHECK (wash_time IN ('15Min for Car', '10Min for Bike', '20Min for Truck')),
                token VARCHAR(50) NOT NULL UNIQUE,
                status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
                wash_start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                estimated_completion_time TIMESTAMP,
                completed_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
    })
    .then(() => {
        console.log('✅ Vehicles table ready');
        return client.query('SELECT version()');
    })
    .then((result) => {
        console.log('PostgreSQL version:', result.rows[0].version);
    })
    .catch((error) => {
        console.log('❌ Error Connecting to PostgreSQL:', error.message);
    })

// Make the client available to your routes
app.set('dbClient', client)

const vehicleController = require('./controllers/vehicleController');

vehicleController.setClient(client);  // ← ADD THIS LINE

// API Routes
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    console.log('Login attempt:', { username, password });
    
    if (username === 'EsamAzam' && password === 'april2004') {
        const token = 'auth-' + Date.now();
        sessions.set(token, { 
            username, 
            loginTime: new Date(),
            role: 'admin'
        });
        
        console.log('Login successful, token generated:', token);
        
        res.json({ 
            success: true, 
            token: token,
            message: 'Login successful' 
        });
    } else {
        res.status(401).json({ 
            success: false, 
            message: 'Invalid username or password' 
        });
    }
});

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
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'login.html'));
});

app.get('/dashboard' ,(req, res) => {
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
// FIXED: Use proper regex pattern
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
    });
}