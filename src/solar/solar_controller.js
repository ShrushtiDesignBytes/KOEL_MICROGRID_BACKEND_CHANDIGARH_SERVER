var db = require('../../config/db');
const Solar = db.solar;
const sequelize = db.sequelize
const { Op } = require('sequelize');

module.exports = {

    //get all solar
    getSolar: async (req, res) => {
        try {
            const result = await Solar.findOne({
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

            const result_lastentry = await Solar.findOne({
                attributes: ['hours_operated'], 
                where: {
                    createdAt: {
                        [Op.lte]: sequelize.literal('CURRENT_DATE'), 
                    },
                },
                order: [['createdAt', 'DESC']], 
                limit: 1, 
            });

           // console.log(result_lastentry.hours_operated)
        
            const solar = await Solar.findOne({
                order: [['id', 'DESC']],  
                limit: 1                  
            });

            if (solar && result) {
                solar.dataValues.avg_total_generation = Math.floor(result.get('avg_total_generations'));
            }

            if(result_lastentry){
                solar.dataValues.avg_hours_operated = result_lastentry.get('hours_operated');
            }

            await Solar.update(
                { total_generation: Math.floor(result.get('avg_total_generations')) },  
                { where: { id: solar.id } }  
            );

            return res.status(200).send(
               [solar]
            );
        } catch (error) {
            return res.status(400).send(
                error.message
            );
        }
    },

    //add solar
    createSolar: async (req, res) => {
        const solarArray = req.body

        try {
            const createdSolar = []

            for (const solardata of solarArray) {
                const { breaker_status, frequency, current, kVA, kW, maintainance_last_date, next_due, notification_alarms, operating_hours, power_factor, shutdown, total_generation, total_saving, total_utilisation, utilisation, voltagel, voltagen, hours_operated, power_generated, daily_generation } = solardata;
                try {
                    const result = await sequelize.query(
                        `CALL insert_unique_solar(
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
                    }
                    );

                    const solar = result[0][0].result_json;

                    const data = solar === null ? 'Already saved same data in database' : solar;
                    createdSolar.push(data);

                } catch (innerError) {
                    createdSolar.push({ error: `Failed to process data for solar: ${innerError.message}` });
                }
            }

            return res.status(200).send(createdSolar);
        } catch (error) {
            console.log(error)
            return res.status(500).json(
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
    },

    getChartData: async (req, res) => {
        try {
            const data = await Solar.sequelize.query(
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
              FROM solar
              WHERE "createdAt" >= NOW() - INTERVAL '8 hours'
              GROUP BY hour
              ORDER BY hour;
              `,
                { type: Solar.sequelize.QueryTypes.SELECT }
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