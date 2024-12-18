const express = require('express');
const { getGenset, createGenset, viewGenset, deleteGenset, updateGenset } = require('./genset_controller.js');

const router = express.Router();

//get all Overview
router.get('/', getGenset);

//add Overview
router.post('/', createGenset) 

//Overview details
router.get('/:id', viewGenset)

//delete Overview
router.delete('/:id', deleteGenset)

//Overview update
router.patch('/:id',  updateGenset)

module.exports = router;