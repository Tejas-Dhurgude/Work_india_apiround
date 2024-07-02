const express = require("express");
const jwt = require("jsonwebtoken");
const app = express();
const pool = require("./db");
require("dotenv").config();

app.use(express.json());

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Extract token from "Bearer <token>"

  if (!token)
    return res.status(403).send("A token is required for authentication");

  jwt.verify(token, process.env.SECRETKEY, (err, user) => {
    if (err) return res.status(401).send("Invalid Token");

    req.user = user; // Attach user info to request object
    console.log("Authenticated User:", req.user); // Log to check if user is being set correctly
    next();
  });
};

app.post("/signup", async (req, res) => {
  try {
    const { username, password, email } = req.body;
    if (!username || !password || !email) {
      return res
        .status(400)
        .json({ error: "Username,email and password are required" });
    }
    const newQ = await pool.query(
      `INSERT INTO users (username, password,email) VALUES ($1, $2,$3)`,
      [username, password, email]
    );

    res.json({
      status: "Account created successfully",
      status_code: 200,
      user: newQ.rows[0].user_id,
    });
  } catch (err) {
    console.log(err);
  }
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username and password are required" });
    }

    const queryText = "SELECT * FROM users WHERE username = $1";
    const values = [username];
    const result = await pool.query(queryText, values);

    if (result.rows.length) {
      const token = jwt.sign(
        { userId: result.rows[0].id },
        process.env.SECRETKEY
      );
      res.json({
        status: "Login Sucessfully",
        status_code: 200,
        user_id: result.rows[0].user_id,
        access_token: token,
      });
    } else {
      res.status(401).json({
        status: "Incoreect username,password . please retry",
        status_code: 401,
      });
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/shorts/create", async (req, res) => {
  try {
    const {
      category,
      title,
      author,
      publish_date,
      content,
      actual_content_link,
      image,
      upvote,
      downvote,
    } = req.body;
    const newQ = await pool.query(
      `INSERT INTO data (category,title,author,publish_date,content,actual_content_link,image,upvote,downvote) VALUES ($1, $2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        category,
        title,
        author,
        publish_date,
        content,
        actual_content_link,
        image,
        upvote,
        downvote,
      ]
    );

    res.json({
      message: "Short added successfully",
      status_code: 200,
    });
  } catch (err) {
    console.log(err);
  }
});

app.get("/shorts/feed", async (req, res) => {
  try {
    const allInfo = await pool.query(
      "SELECT * FROM data order by publish_date desc,upvote desc"
    );
    res.json(allInfo.rows);
  } catch (err) {
    console.log(err);
  }
});

app.get(
  "/shorts/filter/:category/:upvote/:a",
  authenticateToken,
  async (req, res) => {
    const category = req.params.category;
    const upvote = req.params.upvote;
    const a = req.params.a;
    console.log(a);

    try {
      const allInfo = await pool.query(
        `SELECT * FROM data WHERE category = $1 AND upvote >= $2 AND title LIKE $3`,
        [category, upvote, `%${a}%`]
      );

      res.json(allInfo.rows);
    } catch (err) {
      console.log(err);
    }
  }
);

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
