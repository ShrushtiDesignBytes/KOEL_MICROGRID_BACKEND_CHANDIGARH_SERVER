var db = require('../../config/db');
const Overview = db.overview;

module.exports = {

    //get all overview
    getOverview: async (req, res) => {
        try {
            const overview = await Overview.findAll();
            return res.status(200).send(
                overview
            );
        } catch (error) {
            return res.status(400).send(
                error.message
            );
        }
    },

    //add overview
    createOverview: async (req, res) => {
        const { average_power_kw, average_power_kva, mains_operated_yesterday, genset_operated_yesterday, ess_energy_stored, soc_ess, alerts, shutdown, av_current_amp, average_voltagel, average_voltagen, savings, energy, solar, genset, daily_generation } = req.body
        try {
            const overview = await Overview.create({ average_power_kw, average_power_kva, mains_operated_yesterday, genset_operated_yesterday, ess_energy_stored, soc_ess, alerts, shutdown, av_current_amp, average_voltagel, average_voltagen, savings, energy, solar, genset, daily_generation });
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
        const { average_power_kw, average_power_kva, mains_operated_yesterday, genset_operated_yesterday, ess_energy_stored, soc_ess, alerts, shutdown, av_current_amp, average_voltagel, average_voltagen, savings, energy, solar, genset, daily_generation } = req.body
        try {
            const overview = await Overview.update( 
                { average_power_kw, average_power_kva, mains_operated_yesterday, genset_operated_yesterday, ess_energy_stored, soc_ess, alerts, shutdown, av_current_amp, average_voltagel, average_voltagen, savings, energy, solar, genset, daily_generation },
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