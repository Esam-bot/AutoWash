const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const path = require('path')
const app = express()
app.use(cors())

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, 'frontend')))
app.use(express.json())

const sessions = new Map()

function requireAuth(req, res, next) {
    console.log('Authorization header:', req.headers.authorization);
    
    const authHeader = req.headers.authorization;
    
    // Extract token from "Bearer <token>" format
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

// Routes
const vehicleRoutes = require('./routes/vehicleRoutes')

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://car_management:carmanagement123@cluster0.z64gx4e.mongodb.net/can_wash_system?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})    
.then(() => {
    console.log('MongoDB CONNECTED successfully')
})
.catch((error) => {
    console.log('Error Connecting MongoDB:', error.message)
})

// Public routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "frontend", "login.html"))
})

// Login API endpoint
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

// Use vehicle routes with authentication
app.use('/api/vehicles', requireAuth, vehicleRoutes)

// Dashboard route - FIXED: Use absolute path
app.get('/dashboard', (req, res) => {
    console.log('Dashboard route accessed');
    res.sendFile(path.join(__dirname, 'frontend', 'hello.html'));
});

// hello.html route for direct access
app.get('/hello.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'hello.html'))
})

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

// Catch-all route for SPA - THIS IS IMPORTANT
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'login.html'));
});

// PORT connection
const PORT = process.env.PORT || 9000;
app.listen(PORT, () => {
    console.log('Server running on port 9000')
    console.log('Frontend available at: http://localhost:9000')
    console.log('Dashboard available at: http://localhost:9000/dashboard')
    console.log('Login available at: http://localhost:9000/')
})