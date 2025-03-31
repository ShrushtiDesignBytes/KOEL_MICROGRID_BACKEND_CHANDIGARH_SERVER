var db = require('../../config/db');
const Solar = db.solar;
const sequelize = db.sequelize
const { Op, literal } = require('sequelize');

module.exports = {

    //get all solar
    getSolar: async (req, res) => {
        try {
            const result = await Solar.sequelize.query(`
               WITH hourly_avg AS (
                    SELECT 
                    DATE_TRUNC('hour', "createdAt" + INTERVAL '5 hours 30 minutes') AS hour,
                    AVG(
                            (("kW"->>'phase1')::FLOAT + 
                            ("kW"->>'phase2')::FLOAT + 
                            ("kW"->>'phase3')::FLOAT)
                        ) AS avg_kW_per_hour
                    FROM Solar
                    WHERE "createdAt" >= CURRENT_DATE
                    AND "createdAt" < CURRENT_DATE + INTERVAL '1 day'
                    GROUP BY hour
                )
                SELECT SUM(avg_kW_per_hour) AS avg_daily_total_generations FROM hourly_avg;

            `, {
                type: sequelize.QueryTypes.SELECT
            });

            const daily_generation = result[0].avg_daily_total_generations;

            const result_total = await Solar.sequelize.query(`
                WITH hourly_avg AS (
                    SELECT 
                    DATE_TRUNC('hour', "createdAt" + INTERVAL '5 hours 30 minutes') AS hour,  -- Truncate to the hour with IST adjustment
                    AVG(
                            (("kW"->>'phase1')::FLOAT + 
                            ("kW"->>'phase2')::FLOAT + 
                            ("kW"->>'phase3')::FLOAT)
                        ) AS avg_kW_per_hour  -- Calculate the average kW per hour
                    FROM 
                    solar
                    WHERE 
                        "createdAt" >= (SELECT MIN("createdAt") FROM Solar)  -- Start from the earliest available data
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

            const result_lastentry = await Solar.findOne({
                attributes: ['hours_operated'],
                where: {
                    createdAt: {
                        [Op.lte]: sequelize.literal('CURRENT_DATE'),
                    },
                    hours_operated: {
                        [Op.ne]: null,
                        [Op.ne]: ''
                    }
                },
                order: [['createdAt', 'DESC']],
                limit: 1,
            });

            const result_power = await Solar.sequelize.query(`
                WITH hourly_avg AS (
                    SELECT 
                    DATE_TRUNC('hour', "createdAt" + INTERVAL '5 hours 30 minutes') AS hour,
                    AVG(
                            (("kW"->>'phase1')::FLOAT + 
                            ("kW"->>'phase2')::FLOAT + 
                            ("kW"->>'phase3')::FLOAT)
                        ) AS avg_kW_per_hour
                    FROM Solar
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

            const result_power_before = await Solar.sequelize.query(`
                WITH hourly_avg AS (
                    SELECT 
                    DATE_TRUNC('hour', "createdAt" + INTERVAL '5 hours 30 minutes') AS hour,
                    AVG(
                            (("kW"->>'phase1')::FLOAT + 
                            ("kW"->>'phase2')::FLOAT + 
                            ("kW"->>'phase3')::FLOAT)
                        ) AS avg_kW_per_hour
                    FROM Solar
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

            const solar = await Solar.findOne({
                where: {

                    operating_hours: {
                        [Op.ne]: null,
                        [Op.ne]: ''
                    },
                    hours_operated: {
                        [Op.ne]: null,
                        [Op.ne]: ''
                    }
                },
                order: [['createdAt', 'DESC']]
            });

            const kwh = await Solar.findOne({
                where: {
                    kwh: {
                        [Op.ne]: null,
                        [Op.ne]: 0
                    }
                },
                order: [['createdAt', 'DESC']]
            });

            const firstRow = await Solar.findOne({
                order: [['id', 'ASC']],
                where: {
                    kwh: {
                        [Op.ne]: null,
                        [Op.ne]: 0
                    }
                },
                attributes: ['kwh'],
            });

            const lastRow = await Solar.findOne({
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
                solar.dataValues.kwh_diff = kwhDifference;
            }

            if (kwh) {
                solar.dataValues.kwh = kwh.dataValues.kwh;
            }

            if (solar.dataValues.breaker_status === null) {
                solar.dataValues.breaker_status = 'OFF'
            }



            if (solar && result) {
                solar.dataValues.avg_daily_total_generation = Math.floor(daily_generation);
            }

            if (result_total) {
                solar.dataValues.avg_total_generation = Math.floor(total);
            }

            if (result_lastentry) {
                solar.dataValues.avg_hours_operated = result_lastentry.get('hours_operated');
            }

            if (result_power) {
                solar.dataValues.power_generated_yesterday = power_generation_yesterday;
            }

            if (result_power_before) {
                solar.dataValues.power_generated_before_yesterday = power_generation_before_yesterday;
            }

            await Solar.update(
                {
                    total_generation: Math.floor(total),
                    power_generated: power_generation_yesterday
                },
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

                const { breaker_status, frequency, current, kVA, kW, maintainance_last_date, next_due, operating_hours, power_factor, voltagel, voltagen, hours_operated, kwh, unit_generated } = solardata;

                const { id, ...filteredData } = solardata;

                //console.log('data', filteredData)

                const localID = await Solar.findOne({
                    where: {
                        localId: id
                    }
                });

                //console.log(localID)

                if (localID !== null) {
                    await Solar.update(filteredData,
                        {
                            where: {
                                localId: id
                            }
                        });

                    createdSolar.push('Updated Succesfully')
                } else {
                    //console.log(solardata.id)
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
                            :v_operating_hours,
                            :v_power_factor,
                            :v_voltagel,
                            :v_voltagen,
                            :v_hours_operated,
                            :v_localId,
                            :v_kwh,
                            :v_unit_generated,
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
                                v_operating_hours: operating_hours,
                                v_power_factor: power_factor,
                                v_voltagel: JSON.stringify(voltagel),
                                v_voltagen: JSON.stringify(voltagen),
                                v_hours_operated: hours_operated,
                                v_localId: id,
                                v_kwh: kwh,
                                v_unit_generated: unit_generated,
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
            const { fromDate, toDate } = req.body;

            const data = await Solar.sequelize.query(
                `WITH hours AS (
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
                    LEFT JOIN solar s ON 
                        TO_CHAR(s."createdAt" + INTERVAL '5 hours 30 minutes', 'YYYY-MM-DD HH24:00:00') = h.hour
                    GROUP BY h.hour
                    ORDER BY h.hour;
              `,
                { type: Solar.sequelize.QueryTypes.SELECT }
            );

            //console.log(data)

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

            const data = await Solar.sequelize.query(
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
                FROM solar s
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
                { type: Solar.sequelize.QueryTypes.SELECT }
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

            const data = await Solar.sequelize.query(
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
            FROM solar s
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
                { type: Solar.sequelize.QueryTypes.SELECT }
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