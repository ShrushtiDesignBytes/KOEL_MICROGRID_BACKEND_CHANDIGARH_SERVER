module.exports = (sequelize, DataTypes) => {
    const Alert = sequelize.define("alert", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },

        fault_code: {
            type: DataTypes.STRING,
        },
        category: {
            type: DataTypes.STRING,
        },
        description: {
            type: DataTypes.STRING,
        },
        severity: {
            type: DataTypes.STRING,
        },
        status: {
            type: DataTypes.STRING,
        },
        date_time: {
            type: DataTypes.STRING,
        },
    },
        {
            freezeTableName: true,
            timestamps: false
        });


    return Alert

}
