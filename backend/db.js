// db.js - Kết nối MySQL qua XAMPP
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 3306,
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'dunavitu_books',
  waitForConnections: true,
  connectionLimit:    10,
  charset: 'utf8mb4',
});

module.exports = pool;
