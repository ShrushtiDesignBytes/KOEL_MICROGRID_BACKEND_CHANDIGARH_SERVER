
module.exports = (sequelize, DataTypes) => {
    const Overview = sequelize.define("overview", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
       average_power_kw: {
            type: DataTypes.STRING,
        },
       average_power_kva: {
            type: DataTypes.STRING,
        },
       mains_operated_yesterday: {
            type: DataTypes.STRING,
        },
       genset_operated_yesterday: {
            type: DataTypes.STRING,
        },
       ess_energy_stored: {
            type: DataTypes.STRING,
        },
       soc_ess: {
            type: DataTypes.STRING,
        },
       alerts: {
            type: DataTypes.STRING,
        },
       shutdown: {
            type: DataTypes.STRING,
        },
       av_current_amp: {
            type: DataTypes.STRING,
        },
       average_voltagel: {
            type: DataTypes.STRING,
        },
       average_voltagen: {
            type: DataTypes.STRING,
        },
       savings: {
            type: DataTypes.JSON,
        },
       energy: {
            type: DataTypes.JSON,
        },
       solar: {
            type: DataTypes.JSON,
        },
       genset: {
            type: DataTypes.JSON,
        }, 
        daily_generation: {
            type: DataTypes.STRING,
        },   
    },
        {
            freezeTableName: true,
            timestamps: true       });   
            
            
            return Overview

}