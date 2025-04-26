var db = require('../../config/db');
const Sequelize = db.sequelize
const Overview = db.overview;
const Alert = db.alert;
const Solar = db.solar;
const Genset = db.genset;
const Mains = db.mains;
const BASEURL = 'http://localhost:5001/micro';

module.exports = {

    //get all overview
    getOverview: async (req, res) => {
        try {
            const overview = await Overview.findOne({
                order: [['id', 'DESC']],
                limit: 1
            });
            const response = await fetch(`${BASEURL}/solar`)
            const data = await response.json();
            const solar = data[0]

            const responseg = await fetch(`${BASEURL}/genset`)
            const data_g = await responseg.json();
            const genset = data_g[0]

            const responsem = await fetch(`${BASEURL}/mains`)
            const data_m = await responsem.json();
            const mains = data_m[0]

            const alertCounts = await Alert.findAll({
                attributes: [
                    [Sequelize.fn('COUNT', Sequelize.literal("CASE WHEN LOWER(severity) = 'alert' THEN 1 END")), 'alert'],
                    [Sequelize.fn('COUNT', Sequelize.literal("CASE WHEN LOWER(severity) = 'shutdown' THEN 1 END")), 'shutdown']
                ],
                raw: true
            });

            const alert = {
                alert: alertCounts[0].alert,
                shutdown: alertCounts[0].shutdown
            };

            const result = await Solar.sequelize.query(`WITH hours AS (
        SELECT 
            TO_CHAR(generated_hour + INTERVAL '5 hours 30 minutes', 'YYYY-MM-DD HH24:00:00') AS hour
        FROM generate_series(
            (DATE_TRUNC('month', NOW() AT TIME ZONE 'Asia/Kolkata') + INTERVAL '1 hour') AT TIME ZONE 'UTC',
            (NOW() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'UTC',
            INTERVAL '1 hour'
        ) AS generated_hour
    ), 

    solar_data AS (
        SELECT 
            TO_CHAR(s."createdAt" + INTERVAL '5 hours 30 minutes', 'YYYY-MM-DD HH24:00:00') AS hour,
            MAX(s.kwh) AS solar_kwh  
        FROM solar s
        WHERE s."createdAt" >= (DATE_TRUNC('month', NOW() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'UTC')
        GROUP BY hour
    ), 

    main_data AS (
    SELECT 
        TO_CHAR(g."createdAt" + INTERVAL '5 hours 30 minutes', 'YYYY-MM-DD HH24:00:00') AS hour,
            MAX(g.kwh) AS main_kwh  
        FROM main g
        WHERE g."createdAt" >= (DATE_TRUNC('month', NOW() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'UTC')

        GROUP BY hour
    ),

    savings_data AS (
        SELECT 
            h.hour,
            s.solar_kwh,
            g.main_kwh,
            CASE 
                WHEN COALESCE(ABS(s.solar_kwh - LAG(s.solar_kwh) OVER (ORDER BY h.hour)), 0) > 0 
                AND COALESCE(ABS(g.main_kwh - LAG(g.main_kwh) OVER (ORDER BY h.hour)), 0) > 0 
                THEN COALESCE(ABS(s.solar_kwh - LAG(s.solar_kwh) OVER (ORDER BY h.hour)), 0) * 6.6
                ELSE 0
            END AS savings
        FROM hours h
        LEFT JOIN solar_data s ON h.hour = s.hour
        LEFT JOIN main_data g ON h.hour = g.hour
    )

    SELECT 
        -- hour,
        -- solar_kwh,
        -- main_kwh,
        sum(savings)
    FROM savings_data

        WHERE savings < 2000 and main_kwh <> 0 
        -- ORDER BY hour
        ;
    `, {
                type: Sequelize.QueryTypes.SELECT,
            });

            const result_2 = await Solar.sequelize.query(`WITH hours AS (
        SELECT 
            TO_CHAR(generated_hour + INTERVAL '5 hours 30 minutes', 'YYYY-MM-DD HH24:00:00') AS hour
        FROM generate_series(
            (DATE_TRUNC('month', NOW() AT TIME ZONE 'Asia/Kolkata') + INTERVAL '1 hour') AT TIME ZONE 'UTC',
            (NOW() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'UTC',
            INTERVAL '1 hour'
        ) AS generated_hour
    ), 

    solar_data AS (
        SELECT 
            TO_CHAR(s."createdAt" + INTERVAL '5 hours 30 minutes', 'YYYY-MM-DD HH24:00:00') AS hour,
            MAX(s.kwh) AS solar_kwh  
        FROM solar s
        WHERE s."createdAt" >= (DATE_TRUNC('month', NOW() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'UTC')
        GROUP BY hour
    ), 

    genset_data AS (
    SELECT 
        TO_CHAR(g."createdAt" + INTERVAL '5 hours 30 minutes', 'YYYY-MM-DD HH24:00:00') AS hour,
            MAX(g.kwh) AS genset_kwh  
        FROM genset g
        WHERE g."createdAt" >= (DATE_TRUNC('month', NOW() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'UTC')

        GROUP BY hour
    ),

    savings_data AS (
        SELECT 
            h.hour,
            s.solar_kwh,
            g.genset_kwh,
            CASE 
                WHEN COALESCE(ABS(s.solar_kwh - LAG(s.solar_kwh) OVER (ORDER BY h.hour)), 0) > 0 
                AND COALESCE(ABS(g.genset_kwh - LAG(g.genset_kwh) OVER (ORDER BY h.hour)), 0) > 0 
                THEN COALESCE(ABS(s.solar_kwh - LAG(s.solar_kwh) OVER (ORDER BY h.hour)), 0) * 18.4
                ELSE 0
            END AS savings
        FROM hours h
        LEFT JOIN solar_data s ON h.hour = s.hour
        LEFT JOIN genset_data g ON h.hour = g.hour
    )

    SELECT 
        -- hour,
        -- solar_kwh,
        -- genset_kwh,
        sum(savings)
    FROM savings_data

        WHERE savings < 2000 and genset_kwh <> 0 
        -- ORDER BY hour
        ;
                `, {
                type: Sequelize.QueryTypes.SELECT,
            });

            const result_3 = await Solar.sequelize.query(`
WITH min_dates AS (
    SELECT LEAST(
        (SELECT MIN(s."createdAt") FROM solar s),
        (SELECT MIN(m."createdAt") FROM main m)
    ) AS start_date
),

hours AS (
    SELECT 
        TO_CHAR(generated_hour + INTERVAL '5 hours 30 minutes', 'YYYY-MM-DD HH24:00:00') AS hour
    FROM min_dates,
    generate_series(
        min_dates.start_date,
        NOW() AT TIME ZONE 'UTC',
        INTERVAL '1 hour'
    ) AS generated_hour
),


solar_data AS (
    SELECT 
        TO_CHAR(s."createdAt" + INTERVAL '5 hours 30 minutes', 'YYYY-MM-DD HH24:00:00') AS hour,
        MAX(s.unit_generated) AS solar_unit_generated,
        MAX(s.kwh) AS solar_kwh  
    FROM solar s
    WHERE s."createdAt" >= (SELECT start_date FROM min_dates)
    GROUP BY hour
    HAVING MAX(s.kwh) > 0
),

main_data AS (
    SELECT 
        TO_CHAR(m."createdAt" + INTERVAL '5 hours 30 minutes', 'YYYY-MM-DD HH24:00:00') AS hour,
        MAX(m.unit_generated) AS mains_unit_generated,
        MAX(m.kwh) AS main_kwh  
    FROM main m
    WHERE m."createdAt" >= (SELECT start_date FROM min_dates)
    GROUP BY hour
    HAVING MAX(m.kwh) > 0
),

savings_data AS (
    SELECT 
        h.hour,
        s.solar_kwh,
        m.main_kwh,
        COALESCE(
            CASE 
                WHEN COALESCE(s.solar_kwh - LAG(s.solar_kwh, 1, s.solar_kwh) OVER(ORDER BY h.hour), 0) > 0 
                 AND COALESCE(m.main_kwh - LAG(m.main_kwh, 1, m.main_kwh) OVER(ORDER BY h.hour), 0) > 0 
                THEN (s.solar_kwh - LAG(s.solar_kwh, 1, s.solar_kwh) OVER(ORDER BY h.hour)) * 6.6
                ELSE 0
            END, 0
        ) AS savings
    FROM hours h
    LEFT JOIN solar_data s ON h.hour = s.hour
    LEFT JOIN main_data m ON h.hour = m.hour
)

SELECT 
    SUM(savings) AS total_savings
FROM savings_data;
                                        `, {
                type: Sequelize.QueryTypes.SELECT,
            });

            const result_4 = await Solar.sequelize.query(`
WITH min_dates AS (
    SELECT LEAST(
        (SELECT MIN(s."createdAt") FROM solar s),
        (SELECT MIN(m."createdAt") FROM genset m)
    ) AS start_date
),

hours AS (
    SELECT 
        TO_CHAR(generated_hour + INTERVAL '5 hours 30 minutes', 'YYYY-MM-DD HH24:00:00') AS hour
    FROM min_dates,
    generate_series(
        min_dates.start_date,
        NOW() AT TIME ZONE 'UTC',
        INTERVAL '1 hour'
    ) AS generated_hour
),

solar_data AS (
    SELECT 
        TO_CHAR(s."createdAt" + INTERVAL '5 hours 30 minutes', 'YYYY-MM-DD HH24:00:00') AS hour,
        MAX(s.unit_generated) AS solar_unit_generated,
        MAX(s.kwh) AS solar_kwh  
    FROM solar s
    WHERE s."createdAt" >= (SELECT start_date FROM min_dates)
    GROUP BY hour
    HAVING MAX(s.kwh) > 0
),

genset_data AS (
    SELECT 
        TO_CHAR(m."createdAt" + INTERVAL '5 hours 30 minutes', 'YYYY-MM-DD HH24:00:00') AS hour,
        MAX(m.unit_generated) AS mains_unit_generated,
        MAX(m.kwh) AS genset_kwh  
    FROM genset m
    WHERE m."createdAt" >= (SELECT start_date FROM min_dates)
    GROUP BY hour
    HAVING MAX(m.kwh) > 0
),

savings_data AS (
    SELECT 
        h.hour,
        s.solar_kwh,
        m.genset_kwh,
        COALESCE(
            CASE 
                WHEN COALESCE(s.solar_kwh - LAG(s.solar_kwh, 1, s.solar_kwh) OVER(ORDER BY h.hour), 0) > 0 
                 AND COALESCE(m.genset_kwh - LAG(m.genset_kwh, 1, m.genset_kwh) OVER(ORDER BY h.hour), 0) > 0 
                THEN (s.solar_kwh - LAG(s.solar_kwh, 1, s.solar_kwh) OVER(ORDER BY h.hour)) * 18.4
                ELSE 0
            END, 0
        ) AS savings
    FROM hours h
    LEFT JOIN solar_data s ON h.hour = s.hour
    LEFT JOIN genset_data m ON h.hour = m.hour
)

SELECT 
    SUM(savings) AS total_savings
FROM savings_data;`

                , {
                    type: Sequelize.QueryTypes.SELECT,
                });

            const average = await Solar.sequelize.query(`WITH hourly_avg AS (
    -- Combine Solar, Main, Genset hourly averages
    SELECT 
        TO_CHAR("createdAt" + INTERVAL '5 hours 30 minutes', 'Dy') AS day,
        DATE_TRUNC('hour', "createdAt" + INTERVAL '5 hours 30 minutes') AS hour,
        AVG(
            (("kW"->>'phase1')::FLOAT + 
             ("kW"->>'phase2')::FLOAT + 
             ("kW"->>'phase3')::FLOAT)
        ) AS avg_kW_per_hour,
        CASE 
            -- Define "last week" from previous Sunday's start to this past Saturday
            WHEN "createdAt" >= DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '1 day' - INTERVAL '7 days'
                 AND "createdAt" < DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '1 day'
            THEN 'last_week'
            
            -- Define "current week" from this Sunday's start to now
            WHEN "createdAt" >= DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '1 day'
                 AND "createdAt" <= CURRENT_TIMESTAMP
            THEN 'current_week'
        END AS week_category
        FROM (
        SELECT "createdAt", "kW" FROM Solar
        UNION ALL
        SELECT "createdAt", "kW" FROM Main
        UNION ALL
        SELECT "createdAt", "kW" FROM Genset
        ) combined_sources
        WHERE "createdAt" >= DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '1 day' - INTERVAL '7 days'
            AND "createdAt" <= CURRENT_TIMESTAMP
        GROUP BY day, hour, week_category
    )

    -- Calculate total power generation for last week and current week (up to today)
        SELECT 
            day,
            ROUND(SUM(CASE WHEN week_category = 'last_week' THEN avg_kW_per_hour ELSE 0 END)::numeric, 2) AS "lastWeek",
            ROUND(SUM(CASE WHEN week_category = 'current_week' THEN avg_kW_per_hour ELSE 0 END)::numeric, 2) AS "thisWeek"
            FROM hourly_avg
            GROUP BY day
            ORDER BY ARRAY_POSITION(ARRAY['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], day);

        `, {
                type: Sequelize.QueryTypes.SELECT,
            });

            console.log(average)

            const s_m_permonth = result[0].sum;
            const s_m_tillmonth = result_3[0].total_savings;

            const s_g_permonth = result_2[0].sum;
            const s_g_tillmonth = result_4[0].total_savings;

            return res.status(200).send({
                overview,
                solar,
                genset,
                mains,
                alert,
                s_m_permonth,
                s_m_tillmonth,
                s_g_permonth,
                s_g_tillmonth,
                average
            });
        } catch (error) {
            return res.status(400).send(
                error.message
            );
        }
    },

    //add overview
    createOverview: async (req, res) => {
        const { average_power_kw, average_power_kva, mains_operated_yesterday, genset_operated_yesterday, ess_energy_stored, soc_ess, alerts, shutdown, av_current_amp, average_voltagel, average_voltagen, savings, energy, solar, wind, biogas, ess, genset, mains, daily_generation } = req.body
        try {
            const overview = await Overview.create({ average_power_kw, average_power_kva, mains_operated_yesterday, genset_operated_yesterday, ess_energy_stored, soc_ess, alerts, shutdown, av_current_amp, average_voltagel, average_voltagen, savings, energy, solar, wind, biogas, ess, genset, mains, daily_generation });
            return res.status(200).json(
                overview
            );
        } catch (error) {
            return res.status(400).json(
                error.message
            );
        }
    },

    //view overview by id
    viewOverview: async (req, res) => {
        const id = req.params.id
        try {
            const overview = await Overview.findByPk(id);
            return res.status(200).send(
                overview
            );
        } catch (error) {
            return res.status(400).send(
                error.message
            );
        }

    },

    //delete overview by id
    deleteOverview: async (req, res) => {
        const id = req.params.id;
        try {
            const overview = await Overview.destroy({ where: { id: id } });

            return res.status(200).send({
                message: 'Deleted Successfully'
            });
        } catch (error) {
            return res.status(400).send(
                error.message
            );
        }
    },

    //overview update by id
    updateOverview: async (req, res) => {
        const id = req.params.id;
        const { average_power_kw, average_power_kva, mains_operated_yesterday, genset_operated_yesterday, ess_energy_stored, soc_ess, alerts, shutdown, av_current_amp, average_voltagel, average_voltagen, savings, energy, solar, wind, biogas, ess, genset, mains, daily_generation } = req.body
        try {
            const overview = await Overview.update(
                { average_power_kw, average_power_kva, mains_operated_yesterday, genset_operated_yesterday, ess_energy_stored, soc_ess, alerts, shutdown, av_current_amp, average_voltagel, average_voltagen, savings, energy, solar, wind, biogas, ess, genset, mains, daily_generation },
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
            const { solarData, mainsData, gensetData } = await fetchData();
            const averagePowerPerHour = calculateAveragePower(solarData, mainsData, gensetData);

            res.status(200).json(averagePowerPerHour);

        } catch (error) {
            console.error('Error fetching power data:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

// Function to fetch data from the solar and mains APIs
async function fetchData() {
    try {
        // Fetch solar and mains data concurrently
        const [solarResponse, mainsResponse, gensetResponse] = await Promise.all([
            fetch(`${BASEURL}/solar/excel`),
            fetch(`${BASEURL}/mains/excel`),
            fetch(`${BASEURL}/genset/excel`),
        ]);

        if (!solarResponse.ok || !mainsResponse.ok || !gensetResponse.ok) {
            throw new Error('Failed to fetch data from one or both APIs');
        }

        const solarData = await solarResponse.json();
        const mainsData = await mainsResponse.json();
        const gensetData = await gensetResponse.json();

        console.log(solarData, mainsData, gensetData)

        return { solarData, mainsData, gensetData };
    } catch (error) {
        console.error('Error fetching data:', error.message);
        throw error;
    }
}

// Function to calculate average power per hour
function calculateAveragePower(solar, mains, genset) {
    const combined = {};

    // Sum up power values for each hour from solar
    solar.forEach(({ hour, kwh_reading }) => {
        if (!combined[hour]) combined[hour] = { solarSum: 0, solarCount: 0, mainsSum: 0, mainsCount: 0, gensetSum: 0, gensetCount: 0 };
        combined[hour].solarSum += kwh_reading;
        combined[hour].solarCount += 1;
    });

    // Sum up power values for each hour from mains
    mains.forEach(({ hour, kwh_reading }) => {
        if (!combined[hour]) combined[hour] = { solarSum: 0, solarCount: 0, mainsSum: 0, mainsCount: 0, gensetSum: 0, gensetCount: 0 };
        combined[hour].mainsSum += kwh_reading;
        combined[hour].mainsCount += 1;
    });

    // Sum up power values for each hour from mains
    genset.forEach(({ hour, kwh_reading }) => {
        if (!combined[hour]) combined[hour] = { solarSum: 0, solarCount: 0, mainsSum: 0, mainsCount: 0, gensetSum: 0, gensetCount: 0 };
        combined[hour].gensetSum += kwh_reading;
        combined[hour].gensetCount += 1;
    });

    // Calculate average power for each hour
    const result = Object.keys(combined).map(hour => {
        const data = combined[hour];
        const solarAvg = data.solarCount > 0 ? data.solarSum / data.solarCount : 0;
        const mainsAvg = data.mainsCount > 0 ? data.mainsSum / data.mainsCount : 0;
        const gensetAvg = data.gensetCount > 0 ? data.gensetSum / data.gensetCount : 0;
        return {
            hour: parseInt(hour),
            kwh_reading: solarAvg + mainsAvg + gensetAvg
        };
    });

    // Sort by hour
    return result.sort((a, b) => a.hour - b.hour);
}