var db = require('../../config/db');
const Alert = db.alert;

module.exports = {

    //get all alert
    getAlert: async (req, res) => {
        try {
            const alert = await Alert.findAll();
            return res.status(200).send(
                alert
            );
        } catch (error) {
            return res.status(400).send(
                error.message
            );
        }
    },

    //add alert
    createAlert: async (req, res) => {
        const {fault_code,  category,  description,  severity,  status,  date_time} = req.body;
        try {
            const alert = await Alert.create({fault_code,  category,  description,  severity,  status,  date_time});
            return res.status(200).json(
                alert
            );
        } catch (error) {
            return res.status(400).json(
                error.message
            );
        }
    },

    //view alert by id
    viewAlert: async (req, res) => {
        const id  = req.params.id
        try {
            const alert = await Alert.findByPk(id);
            return res.status(200).send(
                alert
            );
        } catch (error) {
            return res.status(400).send(
                 error.message
            );
        }

    },

    //delete alert by id
    deleteAlert: async (req, res) => {
        const id = req.params.id;
        try {
            const alert = await Alert.destroy({ where: {id}});
            return res.status(200).send({
                message: 'Deleted Successfully'
            });
        } catch (error) {
            return res.status(400).send(
                 error.message
            );
        }
    },

    //alert update by id
    updateAlert: async (req, res) => {
        const  id  = req.params.id;
        const {fault_code,  category,  description,  severity,  status,  date_time} = req.body;
        try {
            const alert = await Alert.update({
                fault_code,  category,  description,  severity,  status,  date_time
            },
                {
                    where: {id}
                });
            return res.status(200).send({
                message: 'Updated Successfully'
        });
        } catch (error) {
            return res.status(400).send(
                error.message
            );
        }
    }
}