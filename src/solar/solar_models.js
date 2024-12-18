module.exports = (sequelize, DataTypes) => {
    const Solar = sequelize.define("solar", {

        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        breaker_status: {
            type: DataTypes.STRING,
        },
        frequency: {
            type: DataTypes.STRING,
        },
        current: {
            type: DataTypes.JSON,
        },
        kVA: {
            type: DataTypes.JSON,
        },
        kW: {
            type: DataTypes.JSON,
        },
        maintainance_last_date: {
            type: DataTypes.STRING,
        },
        next_due: {
            type: DataTypes.STRING,
        },
        notification_alarms: {
            type: DataTypes.STRING,
        },
        operating_hours: {
            type: DataTypes.STRING,
        },
        power_factor: {
            type: DataTypes.STRING,
        },
        shutdown: {
            type: DataTypes.STRING,
        },
        total_generation: {
            type: DataTypes.STRING,
        },
        total_saving: {
            type: DataTypes.STRING,
        },
        total_utilisation: {
            type: DataTypes.STRING,
        },
        utilisation: {
            type: DataTypes.STRING,
        },
        voltagel: {
            type: DataTypes.JSON,
        },
        voltagen: {
            type: DataTypes.JSON,
        },
        hours_operated: {
            type: DataTypes.STRING,
        },
        power_generated: {
            type: DataTypes.STRING,
        },
        daily_generation: {
            type: DataTypes.STRING,
        },
    },
        {
            freezeTableName: true,
            timestamps: true
        });


    return Solar

}
