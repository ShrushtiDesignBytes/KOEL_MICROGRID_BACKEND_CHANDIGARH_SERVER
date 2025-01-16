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
            return res.status(200).send({
                overview,
                solar,
                genset,
                mains,
                alert
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
            const { solarData, mainsData } = await fetchData();
            const averagePowerPerHour = calculateAveragePower(solarData, mainsData);

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
        const [solarResponse, mainsResponse] = await Promise.all([
            fetch(`${BASEURL}/solar/chart`),
            fetch(`${BASEURL}/mains/chart`),
        ]);

        if (!solarResponse.ok || !mainsResponse.ok) {
            throw new Error('Failed to fetch data from one or both APIs');
        }

        const solarData = await solarResponse.json();
        const mainsData = await mainsResponse.json();

       // console.log(solarData, mainsData)

        return { solarData, mainsData };
    } catch (error) {
        console.error('Error fetching data:', error.message);
        throw error;
    }
}

// Function to calculate average power per hour
function calculateAveragePower(solar, mains) {
    const combined = {};

    // Sum up power values for each hour from solar
    solar.forEach(({ hour, power }) => {
        if (!combined[hour]) combined[hour] = { solarSum: 0, solarCount: 0, mainsSum: 0, mainsCount: 0 };
        combined[hour].solarSum += power;
        combined[hour].solarCount += 1;
    });

    // Sum up power values for each hour from mains
    mains.forEach(({ hour, power }) => {
        if (!combined[hour]) combined[hour] = { solarSum: 0, solarCount: 0, mainsSum: 0, mainsCount: 0 };
        combined[hour].mainsSum += power;
        combined[hour].mainsCount += 1;
    });

    // Calculate average power for each hour
    const result = Object.keys(combined).map(hour => {
        const data = combined[hour];
        const solarAvg = data.solarCount > 0 ? data.solarSum / data.solarCount : 0;
        const mainsAvg = data.mainsCount > 0 ? data.mainsSum / data.mainsCount : 0;
        return {
            hour: parseInt(hour),
            power: (solarAvg + mainsAvg) / 2
        };
    });

    // Sort by hour
    return result.sort((a, b) => a.hour - b.hour);
}