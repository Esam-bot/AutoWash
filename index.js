const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const path = require('path')
const app = express()
app.use(cors())

// Serve static files (your hello.html and other frontend assets)
app.use(express.static('frontend'))
app.use(express.json())

const sessions = new Map()

function requireAuth(req, res, next) {
    const token = req.headers.authorization;
    
    if (token && sessions.has(token)) {
        req.user = sessions.get(token);
        next();
    } else {
        res.status(401).json({ message: 'Unauthorized. Please login.' });
    }
}

//routes
const vehicleRoutes = require('./routes/vehicleRoutes')


// connection
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

//public route 

app.get('/',(req,res)=>{
    res.sendFile(path.join(__dirname,"/frontend/login.html"))
})

//login api endpoint

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    // Simple authentication (you can enhance this later)
    if (username === 'EsamAzam' && password === 'april2004') {
        const token = 'auth-' + Date.now(); // Generate simple token
        sessions.set(token, { 
            username, 
            loginTime: new Date(),
            role: 'admin'
        });
        
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

// Use your vehicle routes
app.use('/api/vehicles',requireAuth, vehicleRoutes)

// Serve hello.html for the root route
app.get('/hello.html',requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '/frontend/hello.html'))
})

//log-out endpoint

app.post('/api/logout', requireAuth, (req, res) => {
    const token = req.headers.authorization;
    sessions.delete(token);
    res.json({ success: true, message: 'Logged out successfully' });
});

// PORT connection
const PORT = process.env.PORT || 9000;
app.listen(PORT, () => {
    console.log('Server running on port 9000')
    console.log('Frontend available at: http://localhost:9000')
})


