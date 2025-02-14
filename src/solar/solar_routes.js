const express = require('express');
const { getSolar, createSolar, viewSolar, deleteSolar, updateSolar, getChartData, excelData } = require('./solar_controller.js');

const router = express.Router();

//get all Overview
router.get('/', getSolar);

//get all Overview
router.post('/chart', getChartData);

//get all Overview
router.get('/excel', excelData);

//add Overview
router.post('/', createSolar) 

//Overview details
router.get('/:id', viewSolar)

//delete Overview
router.delete('/:id', deleteSolar)

//Overview update
router.patch('/:id',  updateSolar)

module.exports = router;