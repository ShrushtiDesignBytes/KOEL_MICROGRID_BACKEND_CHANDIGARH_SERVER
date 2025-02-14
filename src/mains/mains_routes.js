const express = require('express');
const { getMains, createMains, viewMains, deleteMains, updateMains, getChartData, excelData } = require('./mains_controller.js');

const router = express.Router();

//get all Overview
router.get('/', getMains);

//get all Overview
router.post('/chart', getChartData);

//get all Overview
router.get('/excel', excelData);

//add Overview
router.post('/', createMains) 

//Overview details
router.get('/:id', viewMains)

//delete Overview
router.delete('/:id', deleteMains)

//Overview update
router.patch('/:id',  updateMains)

module.exports = router;