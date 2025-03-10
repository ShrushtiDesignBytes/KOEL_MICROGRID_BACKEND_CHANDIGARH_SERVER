const express = require('express');
const { getGenset, createGenset, viewGenset, deleteGenset, updateGenset, reportData, excelData } = require('./genset_controller.js');

const router = express.Router();

//get all Overview
router.get('/', getGenset);

//get all Overview
router.post('/report', reportData);

//get all Overview
router.get('/excel', excelData);

//add Overview
router.post('/', createGenset) 

//Overview details
router.get('/:id', viewGenset)

//delete Overview
router.delete('/:id', deleteGenset)

//Overview update
router.patch('/:id',  updateGenset)



module.exports = router;