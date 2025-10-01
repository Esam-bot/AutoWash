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
             validator: function(plate) {
                    return /^[A-Z]{2,3}-\d{1,4}$/.test(plate); //pak number plate
                },
                message: 'Invalid number plate format! Use format: ABC-123 or XYZ-1234'
        },
        Assignedlane:{
            type: Number,
            required:true,
            enum: [1 ,2, 3],
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
        },
        washStartTime: {
            type: Date,
            default: Date.now  
        },
        estimatedCompletionTime: {
            type: Date,
            default: function() { 
                const washMinutes = this.WashTime.includes('15') ? 15 : 
                this.WashTime.includes('10') ? 10 : 20;
                const completion = new Date();
                completion.setMinutes(completion.getMinutes() + washMinutes);
                return completion;
            }
        },
        completedAt: {
            type: Date        
        }
    },
    {
        timestamps:true
    }
)

const Vehicle = mongoose.model("Vehicle", vehicleModelSchema);

module.exports = Vehicle;