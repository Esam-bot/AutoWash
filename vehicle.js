const mongoose = require('mongoose')

const vehicleModelSchema = mongoose.Schema(
    {
        Vehicle:{
            type: String,
            required: true,
            enum: ['Car','Bike','Truck']  // Fixed enum syntax
        },
        numberPlate:{
            type: String,
            required: [ true, 'Add Number plate!' ], 
        },
        Assignedlane:{
            type: Number,
            required:true,
            enum: [1 ,2, 3], // Fixed enum values
            message:['1 for cars | 2 for bikes | 3 for trucks']
        },
        Price:{
            type: String,
            required:[true,'add price '],
            enum: ['500PKR for Car', '300PKR for Bike', '800PKR for Truck']
        },
        WashTime:{
            type: String,
            required:true,
            enum: ['15Min for Car', '10Min for Bike', '20Min for Truck']
        },
        Token:{
            type: String,
            required:true,
            unique:true,
        },
        status: {  
            type: String,
            default: 'pending',
            enum: ['pending', 'completed']
        }
    },
    {
        timestamps:true
    }
)

const Vehicle = mongoose.model("Vehicle", vehicleModelSchema);

module.exports = Vehicle;