const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const path = require('path')
const app = express()
app.use(cors())

// Serve static files (your hello.html and other frontend assets)
app.use(express.static('frontend'))
app.use(express.json())

//routes
const vehicleRoutes = require('./routes/vehicleRoutes')

// MongoDB connection
mongoose.connect('mongodb+srv://car_management:car_management123@cluster0.z64gx4e.mongodb.net/car_wash_system?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
})
.then(() => {
    console.log('MongoDB CONNECTED successfully')
})
.catch((error) => {
    console.log('Error Connecting MongoDB:', error.message)
})

// Use your vehicle routes
app.use('/api/vehicles', vehicleRoutes)

// Serve hello.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/frontend/hello.html'))
})

// PORT connection
app.listen(9000, () => {
    console.log('Server running on port 9000')
    console.log('Frontend available at: http://localhost:9000')
})