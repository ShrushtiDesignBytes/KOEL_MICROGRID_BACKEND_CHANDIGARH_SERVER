const express = require('express');
const { getAlert, createAlert, viewAlert, deleteAlert, updateAlert } = require('./alert_controller.js');

const router = express.Router();

//get all Overview
router.get('/', getAlert);

//add Overview
router.post('/', createAlert) 

//Overview details
router.get('/:id', viewAlert)

//delete Overview
router.delete('/:id', deleteAlert)

//Overview update
router.patch('/:id',  updateAlert)

module.exports = router;