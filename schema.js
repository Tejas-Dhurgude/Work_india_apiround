import * as pg from "pg";
const { Client } = pg;
require("dotenv").config();

const client = new Client({
  host: "localhost",
  user: "postgres",
  password: process.env.PASSWORD,
  port: 5432,
});

await client.connect();
