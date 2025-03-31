var db = require('../../config/db');
const Genset = db.genset;
const sequelize = db.sequelize;
const { Op, literal, col, fn } = require('sequelize');

module.exports = {

    //get all genset
    getGenset: async (req, res) => {
        try {
            const result = await Genset.sequelize.query(`
                WITH hourly_avg AS (
                     SELECT 
                     DATE_TRUNC('hour', "createdAt" + INTERVAL '5 hours 30 minutes') AS hour,
                     AVG(
                             (("kW"->>'phase1')::FLOAT + 
                             ("kW"->>'phase2')::FLOAT + 
                             ("kW"->>'phase3')::FLOAT)
                         ) AS avg_kW_per_hour
                     FROM genset
                     WHERE "createdAt" >= CURRENT_DATE
                     AND "createdAt" < CURRENT_DATE + INTERVAL '1 day'
                     GROUP BY hour
                 )
                 SELECT SUM(avg_kW_per_hour) AS avg_daily_total_generations FROM hourly_avg;
 
             `, {
                type: sequelize.QueryTypes.SELECT
            });

            const daily_generation = result[0].avg_daily_total_generations;

            const result_total = await Genset.sequelize.query(`
                WITH hourly_avg AS (
                    SELECT 
                    DATE_TRUNC('hour', "createdAt" + INTERVAL '5 hours 30 minutes') AS hour,  -- Truncate to the hour with IST adjustment
                    AVG(
                            (("kW"->>'phase1')::FLOAT + 
                            ("kW"->>'phase2')::FLOAT + 
                            ("kW"->>'phase3')::FLOAT)
                        ) AS avg_kW_per_hour  -- Calculate the average kW per hour
                    FROM 
                    genset
                    WHERE 
                        "createdAt" >= (SELECT MIN("createdAt") FROM Genset)  -- Start from the earliest available data
                        AND "createdAt" <= CURRENT_TIMESTAMP  -- Until current time
                    GROUP BY 
                        hour  -- Group by the truncated hour
                    )
                    SELECT 
                        SUM(avg_kW_per_hour) AS total_generation  -- Sum of all hourly averages
                    FROM 
                    hourly_avg;
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

            const result_power = await Genset.sequelize.query(`
                WITH hourly_avg AS (
                    SELECT 
                    DATE_TRUNC('hour', "createdAt" + INTERVAL '5 hours 30 minutes') AS hour,
                    AVG(
                            (("kW"->>'phase1')::FLOAT + 
                            ("kW"->>'phase2')::FLOAT + 
                            ("kW"->>'phase3')::FLOAT)
                        ) AS avg_kW_per_hour
                    FROM genset
                    WHERE "createdAt" >= CURRENT_DATE - INTERVAL '1 day'  -- Filter for yesterday's data
                    AND "createdAt" < CURRENT_DATE  -- Exclude today's data
                    GROUP BY hour
                )
                SELECT SUM(avg_kW_per_hour) AS power_generations_yesterday 
                FROM hourly_avg;
 
             `, {
                type: sequelize.QueryTypes.SELECT
            });

            const power_generation_yesterday = result_power[0].power_generations_yesterday;

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


            const result_power_before = await Genset.sequelize.query(`
                                       WITH hourly_avg AS (
                                           SELECT 
                                           DATE_TRUNC('hour', "createdAt" + INTERVAL '5 hours 30 minutes') AS hour,
                                           AVG(
                                                   (("kW"->>'phase1')::FLOAT + 
                                                   ("kW"->>'phase2')::FLOAT + 
                                                   ("kW"->>'phase3')::FLOAT)
                                               ) AS avg_kW_per_hour
                                           FROM genset
                                           WHERE "createdAt" >= CURRENT_DATE - INTERVAL '2 day'  -- Filter for yesterday's data
                                            AND "createdAt" < CURRENT_DATE - INTERVAL '1 day'  -- Exclude today's data
                                           GROUP BY hour
                                       )
                                       SELECT SUM(avg_kW_per_hour) AS power_generations_yesterday 
                                       FROM hourly_avg;
                                    `, {
                type: sequelize.QueryTypes.SELECT
            });

            const power_generation_before_yesterday = result_power_before[0].power_generations_yesterday;

            const genset = await Genset.findOne({
                where: {
                    operating_hours: {
                        [Op.ne]: null,
                        [Op.ne]: ''
                    }
                },
                order: [['createdAt', 'DESC']]
            });

            const kwh = await Genset.findOne({
                where: {
                    kwh: {
                        [Op.ne]: null,
                        [Op.ne]: 0
                    }
                },
                order: [['createdAt', 'DESC']]
            });

            const firstRow = await Genset.findOne({
                order: [['id', 'ASC']],
                where: {
                    kwh: {
                        [Op.ne]: null,
                        [Op.ne]: 0
                    }
                },
                attributes: ['kwh'],
            });

            const lastRow = await Genset.findOne({
                order: [['id', 'DESC']],
                where: {
                    kwh: {
                        [Op.ne]: null,
                        [Op.ne]: 0
                    }
                },
                attributes: ['kwh'],
            });


            if (firstRow && lastRow) {
                const kwhDifference = lastRow.kwh - firstRow.kwh;
                genset.dataValues.kwh_diff = kwhDifference;
            }


            if (kwh) {
                genset.dataValues.kwh = kwh.dataValues.kwh;
            }

            if (genset && result) {
                genset.dataValues.avg_daily_total_generation = Math.floor(daily_generation);
            }

            if (result_total) {
                genset.dataValues.avg_total_generation = Math.floor(total);
            }

            // if(result_lastentry){
            //     genset.dataValues.avg_hours_operated = result_lastentry.get('hours_operated');
            // }

            if (result_power) {
                genset.dataValues.power_generated_yesterday = power_generation_yesterday;
            }

            if (result_power_before) {
                genset.dataValues.power_generated_before_yesterday = power_generation_before_yesterday;
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
                const { coolant_temp, frequency, battery_charged, oil_pressure, hours_operated_yesterday, utilisation_factor, power_factor, power_generated_yesterday, critical_load, non_critical_load, fuel_level, operating_hours, total_generation, total_saving, total_consumption, maintainance_last_date, next_maintainance_date, kVA, kW, voltagel, voltagen, current, tankCapacity, operational, healthIndex, kwh, unit_generated } = gensetdata;

                const { id, ...filteredData } = gensetdata;

                //console.log('data', filteredData)

                const localID = await Genset.findOne({
                    where: {
                        localId: id
                    }
                });

                //console.log(localID)

                if (localID !== null) {
                    await Genset.update(filteredData,
                        {
                            where: {
                                localId: id
                            }
                        });

                    createdGenset.push('Updated Succesfully')
                } else {
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
                            :v_localId,
                            :v_kwh,
                            :v_unit_generated,
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
                                    v_localId: id,
                                    v_kwh: kwh,
                                    v_unit_generated: unit_generated,
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
    },
    getChartData: async (req, res) => {
        try {
            const { fromDate, toDate } = req.body;

            const data = await Genset.sequelize.query(
                `
                WITH hours AS (
                    SELECT 
                        TO_CHAR(generated_hour + INTERVAL '5 hours 30 minutes', 'YYYY-MM-DD HH24:00:00') AS hour
                    FROM generate_series(
                        (DATE_TRUNC('day', ${fromDate ? `'${fromDate}'` : 'NOW()'} AT TIME ZONE 'Asia/Kolkata') + INTERVAL '1 hour') 
                        AT TIME ZONE 'Asia/Kolkata' AT TIME ZONE 'UTC',
                        ${toDate ? `'${toDate}'` : 'NOW()'} AT TIME ZONE 'UTC',
                        INTERVAL '1 hour'
                    ) AS generated_hour
                )
                SELECT 
                    h.hour,
                    COALESCE(SUM(
                        GREATEST(("kW"->>'phase1')::NUMERIC, 0) + 
                        GREATEST(("kW"->>'phase2')::NUMERIC, 0) + 
                        GREATEST(("kW"->>'phase3')::NUMERIC, 0)
                    ), 0) AS totalPower,
                    COALESCE(AVG(
                        GREATEST(("kW"->>'phase1')::NUMERIC, 0) + 
                        GREATEST(("kW"->>'phase2')::NUMERIC, 0) + 
                        GREATEST(("kW"->>'phase3')::NUMERIC, 0)
                    ), 0) AS averagePower
                FROM hours h
                LEFT JOIN genset s 
                    ON TO_CHAR(s."createdAt" + INTERVAL '5 hours 30 minutes', 'YYYY-MM-DD HH24:00:00') = h.hour
                GROUP BY h.hour
                ORDER BY h.hour;
                `,
                { type: Genset.sequelize.QueryTypes.SELECT }
            );


            // Function to convert the data
            function transformData(rawData) {
                return rawData.map(item => {
                    const hour = new Date(item.hour).getHours();

                    const power = Math.floor(parseFloat(item.averagepower));

                    return {
                        hour: hour,
                        power: power
                    };
                });
            }


            const transformedData = transformData(data);

            res.status(200).json(transformedData);

        } catch (error) {
            console.error('Error fetching power data:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },

    excelData: async (req, res) => {
        try {
            const { fromDate, toDate } = req.body;

            const data = await Genset.sequelize.query(
                `WITH hours AS (
                     -- Generate hourly timestamps within the given date range
                    SELECT 
                    TO_CHAR(generated_hour + INTERVAL '5 hours 30 minutes', 'YYYY-MM-DD HH24:00:00') AS hour
                    FROM generate_series(
                        (DATE_TRUNC('day', NOW() AT TIME ZONE 'Asia/Kolkata') + INTERVAL '1 hour') 
                        AT TIME ZONE 'Asia/Kolkata' AT TIME ZONE 'UTC',
                        NOW() AT TIME ZONE 'UTC',
                        INTERVAL '1 hour'
                    ) AS generated_hour
                )

            , power_data AS (
                -- Aggregate power data per hour
                SELECT 
                TO_CHAR(s."createdAt" + INTERVAL '5 hours 30 minutes', 'YYYY-MM-DD HH24:00:00') AS hour,
                MAX(s.unit_generated) AS unit_generated,  -- Get the maximum unit_generated per hour
                MAX(s.kwh) AS kwh         -- Get the latest kWh_reading per hour
                FROM genset s
                GROUP BY hour
            )

           SELECT 
                h.hour,
                    COALESCE(p.unit_generated, 0) AS unit_generation, -- Take the maximum per 5 minutes
                    CASE 
                WHEN (
                    (LAG(p.unit_generated) OVER (ORDER BY h.hour) = 0 AND p.unit_generated > 0) 
                    OR 
                    (LAG(p.unit_generated) OVER (ORDER BY h.hour) > 0 AND p.unit_generated = 0)
                )
                THEN 0
                ELSE COALESCE(ABS(p.kwh - LAG(p.kwh) OVER (ORDER BY h.hour)), 0)
                END AS kwh_reading
            FROM hours h
            LEFT JOIN power_data p ON h.hour = p.hour
            ORDER BY h.hour;

        `,
                { type: Genset.sequelize.QueryTypes.SELECT }
            );

            //console.log(data)

            // Function to convert the data
            function transformData(rawData) {
                return rawData.map(item => {

                    const hour = new Date(item.hour).getHours();

                    const kwh_reading = item.kwh_reading;
                    const unit_generation = item.unit_generation

                    return {
                        hour: hour,
                        kwh_reading: kwh_reading,
                        unit_generation: unit_generation
                    };
                });
            }

            const transformedData = transformData(data);

            res.status(200).json(transformedData);

        } catch (error) {
            console.error('Error fetching power data:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },

    reportData: async (req, res) => {
        try {
            const { fromDate, toDate } = req.body;

            const data = await Genset.sequelize.query(
                `WITH minutes AS (
                        -- Generate 5-minute timestamps within the given date range
                SELECT 
                    TO_CHAR(generated_minute + INTERVAL '5 hours 30 minutes', 'YYYY-MM-DD HH24:MI:00') AS minute
                    FROM generate_series(
                        (DATE_TRUNC('day', ${fromDate ? `'${fromDate}'` : 'NOW()'} AT TIME ZONE 'Asia/Kolkata') + INTERVAL '5 minutes') 
                        AT TIME ZONE 'Asia/Kolkata' AT TIME ZONE 'UTC',
                        ${toDate ? `'${toDate}'` : 'NOW()'} AT TIME ZONE 'UTC',
                        INTERVAL '5 minutes'
                    ) AS generated_minute
                ),
        
                power_data AS (
                -- Aggregate power data per 5-minute interval
                SELECT 
                    TO_CHAR(s."createdAt" + INTERVAL '5 hours 30 minutes', 'YYYY-MM-DD HH24:MI:00') AS minute,
                    MAX(s.unit_generated) AS unit_generated,  -- Get the maximum unit_generated per 5 minutes
                    MAX(s.kwh) AS kwh  -- Get the latest kWh_reading per 5 minutes
                    FROM genset s
                    GROUP BY minute
                )
        
                SELECT 
                m.minute,
                    COALESCE(p.unit_generated, 0) AS unit_generation, -- Take the maximum per 5 minutes
                    CASE 
                WHEN (
                    (LAG(p.unit_generated) OVER (ORDER BY m.minute) = 0 AND p.unit_generated > 0) 
                    OR 
                    (LAG(p.unit_generated) OVER (ORDER BY m.minute) > 0 AND p.unit_generated = 0)
                )
                THEN 0
                ELSE COALESCE(ABS(p.kwh - LAG(p.kwh) OVER (ORDER BY m.minute)), 0)
                END AS kwh_reading
                FROM minutes m
                LEFT JOIN power_data p ON m.minute = p.minute
                ORDER BY m.minute;
        `,
                        { type: Genset.sequelize.QueryTypes.SELECT }
                    );
        
                    //console.log(data)
        
                    // Function to convert the data
                    function transformData(rawData) {
                        return rawData.map(item => {
                            const extractDate = (timestamp) => {
                                return timestamp.split(' ')[0]; // Splits by space and takes the date part
                            };
                            
                            const date = extractDate(item.minute);
                            const hour = new Date(item.minute).getHours();
                            const minute = new Date(item.minute).getMinutes().toString().padStart(2, '0');
                            const amPm = hour >= 12 ? 'PM' : 'AM';
                            const kwh_reading = item.kwh_reading;
                            const unit_generation = item.unit_generation
        
                            return {
                                date: date,
                                minute: `${hour}:${minute} ${amPm}`,
                                kwh_reading: kwh_reading,
                                unit_generation: unit_generation
                            };
                        });
                    }
            const transformedData = transformData(data);

            res.status(200).json(transformedData);

        } catch (error) {
            console.error('Error fetching power data:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}