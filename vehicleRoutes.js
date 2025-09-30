const express = require('express');
const router = express.Router();
const { addvehicle, getvehicle, washvehicle, receipt} = require('../controllers/vehicleController');  

router.post('/wash', addvehicle);
router.get('/wash', getvehicle); 
router.patch('/wash/:id/complete', washvehicle);
router.get('/wash/:id/receipt', receipt);  


module.exports = router;