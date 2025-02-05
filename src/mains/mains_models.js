module.exports = (sequelize, DataTypes) => {
    const Mains = sequelize.define("main", {
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
        operating_hours: {
            type: DataTypes.STRING,
        },
        power_factor: {
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
        localId: {
            type: DataTypes.INTEGER
        }
    },
        {
            freezeTableName: true,
            timestamps: true
        });


    return Mains

}
