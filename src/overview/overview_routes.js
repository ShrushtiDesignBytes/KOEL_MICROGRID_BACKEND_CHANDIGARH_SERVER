const express = require('express');
const { getOverview, createOverview, viewOverview, deleteOverview, updateOverview, getChartData } = require('./overview_controller.js');

const router = express.Router();

//get all Overview
router.get('/', getOverview);

//get all Overview
router.get('/chart', getChartData);

//add Overview
router.post('/', createOverview) 

//Overview details
router.get('/:id', viewOverview)

//delete Overview
router.delete('/:id', deleteOverview)

//Overview update
router.patch('/:id',  updateOverview)

module.exports = router;