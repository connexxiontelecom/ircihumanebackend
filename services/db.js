const { Sequelize, QueryTypes } = require('sequelize');
// const mysql = require('mysql2');
const dotenv = require('dotenv');
let instance = null;
dotenv.config();


const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'mysql'
});


//
// const connection = mysql.createConnection({
//     host: process.env.DB_HOST,
//     user: process.env.DB_USERNAME,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME,
//     port: process.env.DB_PORT
// })

try {
    sequelize.authenticate().then(r =>  console.log('Connection has been established successfully.') );

} catch (error) {
    console.error('Unable to connect to the database:', error);
}

// connection.connect((err) => {
//     if(err)(
//         console.log(err.message)
//     )
//
//     console.log('db '+ connection.state)
// })
//
//
//
// class Db {
//     static getDbInstance(){
//         return instance ? instance: new Db()
//     }
//
//
//
// }
//
//

module.exports = {
    // Db,
    sequelize
}
