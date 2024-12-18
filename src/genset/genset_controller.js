var db = require('../../config/db');
const Genset = db.genset;

module.exports = {

    //get all genset
    getGenset: async (req, res) => {
        try {
            const genset = await Genset.findAll();
            return res.status(200).send(
                genset
            );
        } catch (error) {
            return res.status(400).send(
                error.message
            );
        }
    },

    //add genset
    createGenset: async (req, res) => {
        const { coolant_temp, frequency, battery_charged, oil_pressure, hours_operated_yesterday, utilisation_factor, power_factor, power_generated_yesterday, critical_load, non_critical_load, fuel_level, operating_hours, total_generation, total_saving, total_consumption, maintainance_last_date, next_maintainance_date, kVA, kW, voltagel, voltagen, current, discharging_current, battery_voltage, power_used_yesterday, tankCapacity, operational, healthIndex } = req.body;
        try {
            const genset = await Genset.create({ coolant_temp, frequency, battery_charged, oil_pressure, hours_operated_yesterday, utilisation_factor, power_factor, power_generated_yesterday, critical_load, non_critical_load, fuel_level, operating_hours, total_generation, total_saving, total_consumption, maintainance_last_date, next_maintainance_date, kVA, kW, voltagel, voltagen, current, discharging_current, battery_voltage, power_used_yesterday, tankCapacity, operational, healthIndex });
            return res.status(200).json(
                genset
            );
        } catch (error) {
            return res.status(400).json(
                error.message
            );
        }
    },

    //view genset by id
    viewGenset: async (req, res) => {
        const id = req.params.id
        try {
            const genset = await Genset.findByPk(id);
            return res.status(200).send(
                genset
            );
        } catch (error) {
            return res.status(400).send(
                error.message
            );
        }

    },

    //delete genset by id
    deleteGenset: async (req, res) => {
        const id = req.params.id;
        try {
            const genset = await Genset.destroy({ where: { id } });
            return res.status(200).send({
                message: 'Deleted Successfully'
            });
        } catch (error) {
            return res.status(400).send(
                error.message
            );
        }
    },

    //genset update by id
    updateGenset: async (req, res) => {
        const id = req.params.id;
        const { coolant_temp, frequency, battery_charged, level, oil_pressure, hours_operated_yesterday, utilisation_factor, alert_shutdown, power_factor, power_generated_yesterday, critical_load, non_critical_load, fuel_level, operating_hours, total_generation, total_saving, total_consumption, maintainance_last_date, next_maintainance_date, kVA, kW, voltagel, voltagen, current, discharging_current, battery_voltage, power_used_yesterday, tankCapacity, operational, healthIndex } = req.body;
        try {
            const genset = await Genset.update({ 
                coolant_temp, frequency, battery_charged, level, oil_pressure, hours_operated_yesterday, utilisation_factor, alert_shutdown, power_factor, power_generated_yesterday, critical_load, non_critical_load, fuel_level, operating_hours, total_generation, total_saving, total_consumption, maintainance_last_date, next_maintainance_date, kVA, kW, voltagel, voltagen, current, discharging_current, battery_voltage, power_used_yesterday, tankCapacity, operational, healthIndex 
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