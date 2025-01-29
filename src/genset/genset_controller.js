var db = require('../../config/db');
const Genset = db.genset;
const sequelize = db.sequelize;
const { Op, literal, col, fn } = require('sequelize');

module.exports = {

    //get all genset
    getGenset: async (req, res) => {
        try {
            const result = await Genset.findOne({
                attributes: [
                    [
                        sequelize.fn('AVG',
                            sequelize.literal(`
                                (
                                    ("kW"->>'phase1')::float + 
                                    ("kW"->>'phase2')::float + 
                                    ("kW"->>'phase3')::float
                                ) 
                            `)
                        ),
                        'avg_daily_total_generations'
                    ]
                ],
                where: {
                    createdAt: {
                        [Op.gte]: sequelize.literal('CURRENT_DATE'),
                        [Op.lt]: sequelize.literal("CURRENT_DATE + INTERVAL '1 day'")
                    }
                }
            });

            const result_total = await Mains.sequelize.query(`
                SELECT 
                    SUM(avg_daily_total_generations) AS total_generation
                FROM (
                    SELECT 
                        DATE("createdAt") AS date,
                        AVG(
                            ("kW"->>'phase1')::float + 
                            ("kW"->>'phase2')::float + 
                            ("kW"->>'phase3')::float
                        ) AS avg_daily_total_generations
                    FROM 
                        genset
                    GROUP BY 
                        DATE("createdAt")
                ) AS daily_avg;
            `, { 
                type: sequelize.QueryTypes.SELECT 
            });

            const total = result_total[0].total_generation;


            const result_lastentry = await Genset.findOne({
                attributes: ['hours_operated_yesterday'],
                where: {
                    createdAt: {
                        [Op.lte]: sequelize.literal('CURRENT_DATE'),
                    },
                },
                order: [['createdAt', 'DESC']],
                limit: 1,
            });

            const result_power = await Genset.findOne({
                attributes: [
                    [
                        sequelize.fn(
                            'AVG',
                            sequelize.literal(`
                                               (
                                                 ("kW"->>'phase1')::float + 
                                                 ("kW"->>'phase2')::float + 
                                                 ("kW"->>'phase3')::float
                                               )
                                             `)
                        ),
                        'power_generated_yesterday'
                    ]
                ],
                where: {
                    createdAt: {
                        [Op.gte]: sequelize.literal("CURRENT_DATE - INTERVAL '1 day'"),
                        [Op.lt]: sequelize.literal("CURRENT_DATE")
                    }
                }
            });

            const result_hours = await Genset.sequelize.query(
                `SELECT 
                COUNT(DISTINCT DATE_TRUNC('minute', "createdAt")) AS count 
                FROM genset
                WHERE "createdAt" >= CURRENT_DATE - INTERVAL '1 day'               
                AND "createdAt" < CURRENT_DATE                                 
                AND ("kW"->>'phase1')::float > 0                              
                AND ("kW"->>'phase2')::float > 0                                
                AND ("kW"->>'phase3')::float > 0;                                         
              `,
                { type: Genset.sequelize.QueryTypes.SELECT }
            );

            const totalHours = result_hours[0].count / 60.0;
            const hours = Math.floor(totalHours);

            const minutesFraction = Math.round((totalHours - hours) * 60);
            const minute = minutesFraction / 100

            const formattedTime = hours + minute;


            const genset = await Genset.findOne({
                order: [['id', 'DESC']],
                limit: 1
            });

            if (genset && result) {
                genset.dataValues.avg_daily_total_generation = Math.floor(result.get('avg_daily_total_generations'));
            }

            if (result_total) {
                genset.dataValues.avg_total_generation = Math.floor(total);
            }

            // if(result_lastentry){
            //     genset.dataValues.avg_hours_operated = result_lastentry.get('hours_operated');
            // }

            if (result_power) {
                genset.dataValues.power_generated_yesterday = result_power.get('power_generated_yesterday');
            }

            if (result_hours) {
                genset.dataValues.hours_operated_yesterday = formattedTime.toFixed(2);
            }


            await Genset.update(
                {
                    hours_operated_yesterday: formattedTime.toFixed(2)
                },
                { where: { id: genset.id } }
            );

            return res.status(200).send(
                [genset]
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
                            :v_tankCapacity, 
                            :v_operational,                        
                            :v_healthIndex,
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
                                v_tankCapacity: tankCapacity,
                                v_operational: operational,
                                v_healthIndex: healthIndex,
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