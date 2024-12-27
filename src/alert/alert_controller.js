var db = require('../../config/db');
const Alert = db.alert;
const sequelize = db.sequelize

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
        const alertArray = req.body

        try {

            const createdAlert = [];
            for (const alertdata of alertArray) {
                const { fault_code, category, description, severity, status, date_time } = alertdata;
                try {
                    const result = await sequelize.query(
                        `CALL insert_unique_alert(
                        :v_fault_code,
                        :v_category,
                        :v_description,
                        :v_severity,
                        :v_status,
                        :v_date_time,
                        :result_json
                    )`,
                        {
                            replacements: {
                                v_fault_code: fault_code,
                                v_category: category,
                                v_description: description,
                                v_severity: severity,
                                v_status: status,
                                v_date_time: date_time,
                                result_json: null
                            },
                            type: sequelize.QueryTypes.RAW
                        })

                    const alert = result[0][0].result_json;

                    const data = alert === null ? 'Already saved same data in database' : alert;
                    createdAlert.push(data);

                } catch (innerError) {
                    createdAlert.push({ error: `Failed to process data for alert: ${innerError.message}` });
                }
            }
            return res.status(200).send(createdAlert);
        } catch (error) {
            return res.status(400).json(
                error.message
            );
        }
    },

    //view alert by id
    viewAlert: async (req, res) => {
        const id = req.params.id
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
            const alert = await Alert.destroy({ where: { id } });
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
        const id = req.params.id;
        const { fault_code, category, description, severity, status, date_time } = req.body;
        try {
            const alert = await Alert.update({
                fault_code, category, description, severity, status, date_time
            },
                {
                    where: { id }
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