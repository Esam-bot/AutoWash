const Vehicle = require('../models/vehicle')
 
const generateToken = () => {
   // let tokencounter = 1 
   // const token = `WASH${tokencounter.toString().padStart(4,'0')}`
   // tokencounter++;
   // return token
       return `WASH${Date.now().toString().slice(-6)}`;
 
   // const timestamp = Date.now().toString().slice(-6);
   // const random = Math.random().toString(36).substring(2, 5).toUpperCase();
   // return `WASH${timestamp}${random}`;
}

const checkAndUpdateCompletedVehicles = async () => {
    try {
        const now = new Date();
        const pendingVehicles = await Vehicle.find({ status: 'pending' });
        
        for (let vehicle of pendingVehicles) {
            try {                
                if (now >= vehicle.estimatedCompletionTime) {
                    vehicle.status = 'completed';
                    vehicle.completedAt = new Date();
                    await vehicle.save();
                    console.log(`Auto-completed: ${vehicle.numberPlate}`);
                }
            } catch (vehicleError) {
                console.log('Error processing vehicle:', vehicle._id, vehicleError.message);
                continue;
            }
        }
    } catch (error) {
        console.log('Auto-completion check skipped:', error.message);
    }
}

//adding a vehicle
const addvehicle = async (req, res) => {
    try {
        const { numberPlate, Vehicle, Assignedlane, WashTime } = req.body; // Add missing destructuring
        const plateRegex = /^[A-Z]{2,3}-\d{1,4}$/;
        
        if (!plateRegex.test(numberPlate)) {
            return res.status(400).json({message: 'Invalid number plate format! Use format: ABC-123 or XYZ-1234'});
        }
        
        const existingVehicle = await Vehicle.findOne({ numberPlate: numberPlate});
        if (existingVehicle) {
            return res.status(400).json({message: 'Number plate already exists in the system!'});
        }

        const lastVehicleInLane = await Vehicle.findOne({
            Assignedlane: Assignedlane,
            status: 'pending'
        }).sort({ estimatedCompletionTime: -1 });

        let washStartTime = new Date();
        if (lastVehicleInLane) {
            washStartTime = new Date(lastVehicleInLane.estimatedCompletionTime);
        }

        let washTimeMinutes = 15; // default
        if (WashTime.includes('15')) washTimeMinutes = 15;
        else if (WashTime.includes('10')) washTimeMinutes = 10; 
        else if (WashTime.includes('20')) washTimeMinutes = 20;

        const estimatedCompletionTime = new Date(washStartTime.getTime() + washTimeMinutes * 60000);

        const token = generateToken();
        
        const vehicleData = {
            ...req.body,  
            Token: token,
            status: 'pending',
            washStartTime: washStartTime,           
            estimatedCompletionTime: estimatedCompletionTime  
        };

        const vehicle = await Vehicle.create(vehicleData);
        await checkAndUpdateCompletedVehicles();
        res.status(200).json(vehicle);
    } catch (error) {
        res.status(400).json({message: 'Issue adding a vehicle', error}); 
    }
}
//getting all vehicles
const getvehicle = async (req,res)=>{
    try {
        await checkAndUpdateCompletedVehicles();
        
        const vehicles = await Vehicle.find().sort({ createdAt: -1 });
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
            return res.status(400).json({ 
                success: false,
                message: `Vehicle is already ${vehicle.status}`
            })
        }

    } catch (error) {
        res.status(500).json({message:'Internal server error while updating status'})
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
    receipt,
    checkAndUpdateCompletedVehicles
}

setInterval(checkAndUpdateCompletedVehicles, 60000);