var db = require('../../config/db');
const Genset = db.genset;
const sequelize = db.sequelize;

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
        const gensetArray = req.body

        try {
            const createdGenset = [];
            for (const gensetdata of gensetArray) {
                const { coolant_temp, frequency, battery_charged, oil_pressure, hours_operated_yesterday, utilisation_factor, power_factor, power_generated_yesterday, critical_load, non_critical_load, fuel_level, operating_hours, total_generation, total_saving, total_consumption, maintainance_last_date, next_maintainance_date, kVA, kW, voltagel, voltagen, current, tankCapacity, operational, healthIndex } = gensetdata;

                try {
                    const result = await sequelize.query(
                        `CALL insert_unique_genset(
                            :v_coolant_temp,
                            :v_frequency,
                            :v_battery_charged,
                            :v_oil_pressure,
                            :v_hours_operated_yesterday,
                            :v_utilisation_factor,
                            :v_power_factor,
                            :v_power_generated_yesterday,
                            :v_critical_load,
                            :v_non_critical_load,
                            :v_fuel_level,
                            :v_operating_hours,
                            :v_total_generation,
                            :v_total_saving,
                            :v_total_consumption,
                            :v_maintainance_last_date,
                            :v_next_maintainance_date,
                            :v_kVA,
                            :v_kW,
                            :v_voltagel,
                            :v_voltagen,
                            :v_current,
                            :v_healthIndex,
                            :v_tankCapacity, 
                            :v_operational,
                            :result_json
                        )`,
                        {
                            replacements: {
                                v_coolant_temp: coolant_temp,
                                v_frequency: frequency,
                                v_battery_charged: battery_charged,
                                v_oil_pressure: oil_pressure,
                                v_hours_operated_yesterday: hours_operated_yesterday,
                                v_utilisation_factor: utilisation_factor,
                                v_power_factor: power_factor,
                                v_power_generated_yesterday: power_generated_yesterday,
                                v_critical_load: critical_load,
                                v_non_critical_load: non_critical_load,
                                v_fuel_level: fuel_level,
                                v_operating_hours: operating_hours,
                                v_total_generation: total_generation,
                                v_total_saving: total_saving,
                                v_total_consumption: total_consumption,
                                v_maintainance_last_date: maintainance_last_date,
                                v_next_maintainance_date: next_maintainance_date,
                                v_kVA: JSON.stringify(kVA),
                                v_kW: JSON.stringify(kW),
                                v_voltagel: JSON.stringify(voltagel),
                                v_voltagen: JSON.stringify(voltagen),
                                v_current: JSON.stringify(current),
                                v_healthIndex: healthIndex,
                                v_tankCapacity: tankCapacity,
                                v_operational: operational,
                                result_json: null
                            },
                            type: sequelize.QueryTypes.RAW
                        });
                    const genset = result[0][0].result_json;

                    const data = genset === null ? 'Already saved same data in database' : genset;
                    createdGenset.push(data);

                } catch (innerError) {
                    createdGenset.push({ error: `Failed to process data for genset: ${innerError.message}` });
                }
            }
            return res.status(200).send(createdGenset);
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
        const { coolant_temp, frequency, battery_charged, oil_pressure, hours_operated_yesterday, utilisation_factor, power_factor, power_generated_yesterday, critical_load, non_critical_load, fuel_level, operating_hours, total_generation, total_saving, total_consumption, maintainance_last_date, next_maintainance_date, kVA, kW, voltagel, voltagen, current, tankCapacity, operational, healthIndex } = req.body;
        try {
            const genset = await Genset.update({
                coolant_temp, frequency, battery_charged, oil_pressure, hours_operated_yesterday, utilisation_factor, power_factor, power_generated_yesterday, critical_load, non_critical_load, fuel_level, operating_hours, total_generation, total_saving, total_consumption, maintainance_last_date, next_maintainance_date, kVA, kW, voltagel, voltagen, current, tankCapacity, operational, healthIndex
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