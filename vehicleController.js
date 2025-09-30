const Vehicle = require('../models/vehicle')  // Fixed import path


const generateToken = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `WASH${timestamp}${random}`;
}


//adding a vehicle
const addvehicle = async (req,res)=>{
    try {
        const token = generateToken();
        const vehicleData = {
            ...req.body,
            Token: token,
            status:'pending',
        };


        const vehicle = await Vehicle.create(vehicleData);
        res.status(200).json(vehicle);
    } catch (error) {
        res.status(400).json({message: 'Issue adding a vehicle', error}); 
    }
}

//getting all vehicles
const getvehicle = async (req,res)=>{
    try {
        const vehicles = await Vehicle.find().sort({ createdAt: -1 });;
        res.status(200).json(vehicles);  
    } catch (error) {
        res.status(400).json({message: 'issue getting vehicles', error});
    }
}

//marking a specific vehicle wash completed
const washvehicle = async (req,res)=>{
    try {
        const {id} = req.params;
        const vehicle = await Vehicle.findById(id);
        if(!vehicle){
            return res.status(404).json({message:'No vehicle found with this ID'})
        }
        
        if(vehicle.status === "pending"){ 
            vehicle.status = 'completed';
            vehicle.completedAt = new Date(); 
            vehicle.updatedAt = new Date();
            await vehicle.save();
            res.status(200).json({message:'Vehicle status updated from pending to completed'})
        } else {
            return res.status(400).json({ // Changed to 400
                success: false,
                message: `Vehicle is already ${vehicle.status}`
            })
        }

    } catch (error) {
        res.status(500).json({message:'Internal server error while updating status'}) // Changed to 500
    }
}

//receipt of completed car wash
const receipt = async (req,res)=>{
    try {
        const {id}=req.params;
        const vehicle = await Vehicle.findById(id);
        if(vehicle.status !== "completed"){ 
            return res.status(200).json({
                message:'Vehicle not washed yet!',
            })
        }
        res.status(200).json(vehicle)
    } catch (error) {
        res.status(400).json({message:'error getting receipt'})
    }
}

module.exports ={ 
    addvehicle,
    getvehicle,
    washvehicle,
    receipt
}