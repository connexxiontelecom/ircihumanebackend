const { Sequelize, QueryTypes } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql'
});

/*
const sequelize = new Sequelize('ircihumane', 'root', 'root', {
    host: 'localhost',
    port: 8889,
    dialect: 'mysql'
});
*/

try {
    sequelize.authenticate().then(r =>  console.log('Connection has been established successfully.') );

} catch (error) {
    console.error('Unable to connect to the database:', error);
}

module.exports = {
    sequelize,
    Sequelize
}
