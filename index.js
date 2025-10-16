const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const path = require('path')

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

// Import routes
const vehicleRoutes = require('./routes/vehicleRoutes')

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://car_management:carmanagement123@cluster0.z64gx4e.mongodb.net/can_wash_system?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})    
.then(() => {
    console.log('MongoDB CONNECTED successfully')
})
.catch((error) => {
    console.log('Error Connecting MongoDB:', error.message)
})

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
app.get('*', (req, res) => {
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