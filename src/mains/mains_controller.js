var db = require('../../config/db');
const Mains = db.mains;
const sequelize = db.sequelize;
const { Op } = require('sequelize');

module.exports = {

    //get all mains
    getMains: async (req, res) => {
        try {
            const result = await Mains.findOne({
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
                        'avg_total_generations'
                    ]
                ],
                where: {
                    createdAt: {
                        [Op.gte]: sequelize.literal('CURRENT_DATE'), 
                        [Op.lt]: sequelize.literal("CURRENT_DATE + INTERVAL '1 day'") 
                    }
                }
            });
    
            // If result is found, log and return it
           // console.log(result);

            const mains = await Mains.findOne({
                order: [['id', 'DESC']],  
                limit: 1                  
            });

            if (mains && result) {
                mains.dataValues.avg_total_generation = Math.floor(result.get('avg_total_generations'));
            }

            return res.status(200).send(
               [mains]
            );
        } catch (error) {
            return res.status(400).send(
                error.message
            );
        }
    },

    //add mains
    createMains: async (req, res) => {
        const mainsArray = req.body;

        try {
            const createdMains = [];

            for (const mainsdata of mainsArray) {
                const { breaker_status, frequency, current, kVA, kW, maintainance_last_date, next_due, notification_alarms, operating_hours, power_factor, shutdown, total_generation, total_saving, total_utilisation, utilisation, voltagel, voltagen, hours_operated, power_generated, daily_generation } = mainsdata;

                try {
                    const result = await sequelize.query(
                        `CALL insert_unique_mains(
                            :v_breaker_status,
                            :v_frequency,
                            :v_current,
                            :v_kVA,
                            :v_kW,
                            :v_maintainance_last_date,
                            :v_next_due,
                            :v_notification_alarms,
                            :v_operating_hours,
                            :v_power_factor,
                            :v_shutdown,
                            :v_total_generation,
                            :v_total_saving,
                            :v_total_utilisation,
                            :v_utilisation,
                            :v_voltagel,
                            :v_voltagen,
                            :v_hours_operated,
                            :v_power_generated,
                            :v_daily_generation,
                            :result_json
                        )`, {
                        replacements: {
                            v_breaker_status: breaker_status,
                            v_frequency: frequency,
                            v_current: JSON.stringify(current),
                            v_kVA: JSON.stringify(kVA),
                            v_kW: JSON.stringify(kW),
                            v_maintainance_last_date: maintainance_last_date,
                            v_next_due: next_due,
                            v_notification_alarms: notification_alarms,
                            v_operating_hours: operating_hours,
                            v_power_factor: power_factor,
                            v_shutdown: shutdown,
                            v_total_generation: total_generation,
                            v_total_saving: total_saving,
                            v_total_utilisation: total_utilisation,
                            v_utilisation: utilisation,
                            v_voltagel: JSON.stringify(voltagel),
                            v_voltagen: JSON.stringify(voltagen),
                            v_hours_operated: hours_operated,
                            v_power_generated: power_generated,
                            v_daily_generation: daily_generation,
                            result_json: null
                        },
                        type: sequelize.QueryTypes.RAW
                    });

                    const mains = result[0][0].result_json;

                    const data = mains === null ? 'Already saved same data in database' : mains;
                    createdMains.push(data);

                } catch (innerError) {
                    createdMains.push({ error: `Failed to process data for mains: ${innerError.message}` });
                }
            }
            return res.status(200).send(createdMains);
        } catch (error) {
            console.log(error)
            return res.status(400).json(
                error.message
            );
        }
    },

    //view mains by id
    viewMains: async (req, res) => {
        const id = req.params.id
        try {
            const mains = await Mains.findByPk(id);
            return res.status(200).send(
                mains
            );
        } catch (error) {
            return res.status(400).send(
                error.message
            );
        }

    },

    //delete mains by id
    deleteMains: async (req, res) => {
        const id = req.params.id;
        try {
            const mains = await Mains.destroy({ where: { id } });
            return res.status(200).send({
                message: 'Deleted Successfully'
            });
        } catch (error) {
            return res.status(400).send(
                error.message
            );
        }
    },

    //mains update by id
    updateMains: async (req, res) => {
        const id = req.params.id;
        const { breaker_status, frequency, current, kVA, kW, maintainance_last_date, next_due, notification_alarms, operating_hours, power_factor, shutdown, total_generation, total_saving, total_utilisation, utilisation, voltagel, voltagen, hours_operated, power_generated, daily_generation } = req.body;
        try {
            const mains = await Mains.update({
                breaker_status, frequency, current, kVA, kW, maintainance_last_date, next_due, notification_alarms, operating_hours, power_factor, shutdown, total_generation, total_saving, total_utilisation, utilisation, voltagel, voltagen, hours_operated, power_generated, daily_generation
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
    },
    getChartData: async (req, res) => {
        try {
            const data = await Mains.sequelize.query(
                `
              SELECT 
                TO_CHAR("createdAt", 'YYYY-MM-DD HH24:00:00') AS hour,
                SUM(
                  ("kW"->>'phase1')::NUMERIC + 
                  ("kW"->>'phase2')::NUMERIC + 
                  ("kW"->>'phase3')::NUMERIC
                ) AS totalPower,
                AVG(
                  ("kW"->>'phase1')::NUMERIC + 
                  ("kW"->>'phase2')::NUMERIC + 
                  ("kW"->>'phase3')::NUMERIC
                ) AS power
              FROM main
              WHERE "createdAt" >= NOW() - INTERVAL '8 hours'
              GROUP BY hour
              ORDER BY hour;
              `,
                { type: Mains.sequelize.QueryTypes.SELECT }
            );

            // Function to convert the data
            function transformData(rawData) {
                return rawData.map(item => {
                    // Extract hour (it should be an integer, so use parseInt)
                    const hour = new Date(item.hour).getHours();

                    // Convert totalPower and power to numbers
                    const power = Math.floor(parseFloat(item.power)); 

                    return {
                        hour: hour,
                        power: power 
                    };
                });
            }

    
            const transformedData = transformData(data);

            console.log(transformedData);


            res.json(transformedData);
        } catch (error) {
            console.error('Error fetching power data:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}