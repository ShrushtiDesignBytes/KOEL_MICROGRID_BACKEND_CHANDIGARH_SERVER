var db = require('../../config/db');
const Sequelize = db.sequelize
const Overview = db.overview;
const Alert = db.alert;
const Solar = db.solar;
const Genset = db.genset;
const Mains = db.mains;

module.exports = {

    //get all overview
    getOverview: async (req, res) => {
        try {
            const overview = await Overview.findAll();
            const solar = await Solar.findOne({
                order: [['id', 'DESC']],
            })
            const genset = await Genset.findOne({
                order: [['id', 'DESC']],
            })
            const mains = await Mains.findOne({
                order: [['id', 'DESC']],
            })
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
    }
}