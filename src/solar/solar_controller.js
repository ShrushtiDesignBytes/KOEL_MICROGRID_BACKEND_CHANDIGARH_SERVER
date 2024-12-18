var db = require('../../config/db');
const Solar = db.solar;

module.exports = {

    //get all solar
    getSolar: async (req, res) => {
        try {
            const solar = await Solar.findAll();
            return res.status(200).send(
                solar
            );
        } catch (error) {
            return res.status(400).send(
                error.message
            );
        }
    },

    //add solar
    createSolar: async (req, res) => {
        const { breaker_status, frequency, current, kVA, kW, maintainance_last_date, next_due, notification_alarms, operating_hours, power_factor, shutdown, total_generation, total_saving, total_utilisation, utilisation, voltagel, voltagen, hours_operated, power_generated, daily_generation } = req.body;
        try {
            const solar = await Solar.create(
                { breaker_status, frequency, current, kVA, kW, maintainance_last_date, next_due, notification_alarms, operating_hours, power_factor, shutdown, total_generation, total_saving, total_utilisation, utilisation, voltagel, voltagen, hours_operated, power_generated, daily_generation }
            );
            return res.status(200).json(
                solar
            );
        } catch (error) {
            return res.status(400).json(
                error.message
            );
        }
    },

    //view solar by id
    viewSolar: async (req, res) => {
        const id = req.params.id
        try {
            const solar = await Solar.findByPk(id);
            return res.status(200).send(
                solar
            );
        } catch (error) {
            return res.status(400).send(
                error.message
            );
        }

    },

    //delete solar by id
    deleteSolar: async (req, res) => {
        const id = req.params.id;
        try {
            const solar = await Solar.destroy({ where: { id } });
            return res.status(200).send({
                message: 'Deleted Successfully'
            });
        } catch (error) {
            return res.status(400).send(
                error.message
            );
        }
    },

    //solar update by id
    updateSolar: async (req, res) => {
        const { breaker_status, frequency, current, kVA, kW, maintainance_last_date, next_due, notification_alarms, operating_hours, power_factor, shutdown, total_generation, total_saving, total_utilisation, utilisation, voltagel, voltagen, hours_operated, power_generated, daily_generation } = req.body
        const id = req.params.id;
        try {
            const solar = await Solar.update({
                breaker_status, frequency, current, kVA, kW, maintainance_last_date, next_due, notification_alarms, operating_hours, power_factor, shutdown, total_generation, total_saving, total_utilisation, utilisation, voltagel, voltagen, hours_operated, power_generated, daily_generation
            },
                {
                    where: {
                        id
                    }
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