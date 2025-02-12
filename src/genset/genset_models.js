module.exports = (sequelize, DataTypes) => {
    const Genset = sequelize.define("genset", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        coolant_temp: {
            type: DataTypes.STRING,
        },
        frequency: {
            type: DataTypes.STRING,
        },
        battery_charged: {
            type: DataTypes.STRING,
        },
        oil_pressure: {
            type: DataTypes.STRING,
        },
        hours_operated_yesterday: {
            type: DataTypes.STRING,
        },
        utilisation_factor: {
            type: DataTypes.STRING,
        },
       power_factor: {
            type: DataTypes.STRING,
        },
       power_generated_yesterday: {
            type: DataTypes.STRING,
        },
        critical_load: {
            type: DataTypes.STRING,
        },
        non_critical_load: {
            type: DataTypes.STRING,
        },
        fuel_level: {
            type: DataTypes.STRING,
        },
        operating_hours: {
            type: DataTypes.STRING,
        },
       total_generation: {
            type: DataTypes.STRING,
        },
        total_saving: {
            type: DataTypes.STRING,
        },
       total_consumption: {
            type: DataTypes.STRING,
        },
        maintainance_last_date: {
            type: DataTypes.STRING,
        },
       next_maintainance_date: {
            type: DataTypes.STRING,
        },
       kVA: {
            type: DataTypes.JSON,
        },
        kW: {
            type: DataTypes.JSON,
        },
       voltagel: {
            type: DataTypes.JSON,
        },
       voltagen: {
            type: DataTypes.JSON,
        },
       current: {
            type: DataTypes.JSON,
        },
        tankCapacity: {
            type: DataTypes.STRING,
        },
        operational: {
            type: DataTypes.STRING,
        },
        healthIndex: {
            type: DataTypes.STRING,
        },
        localId: {
            type: DataTypes.INTEGER
        },
        kwh: {
            type: DataTypes.INTEGER
        },
        unit_generated: {
            type: DataTypes.INTEGER
        }
    },
        {
            freezeTableName: true,
            timestamps: true
        });


    return Genset

}
