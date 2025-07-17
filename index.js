import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Server } from 'socket.io';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcrypt';
import session from 'express-session'; // Import express-session
import crypto from 'crypto';

// Use user.db for user authentication
const userDb = await open({
  filename: 'user.db',
  driver: sqlite3.Database
});

// Create users table in user.db
await userDb.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  );
`);

const db = await open({
  filename: 'chat.db',
  driver: sqlite3.Database
});

await db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    content TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  connectionStateRecovery: {}
});

const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(express.static(join(__dirname, 'public')));
app.use(express.json());

// Session middleware
const secret = crypto.randomBytes(64).toString('hex');
app.use(session({
  secret: secret, // Replace with a strong, randomly generated secret
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true in production if using HTTPS
}));

// Middleware to check if user is logged in
const requireLogin = (req, res, next) => {
  if (req.session.userId) {
    next(); // User is logged in, proceed
  } else {
    res.redirect('/login.html'); // Redirect to login page
  }
};

app.get('/', requireLogin, (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

// Signup endpoint
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await userDb.run('INSERT INTO users (username, password) VALUES (?, ?)', username, hashedPassword);
    res.status(201).send({ message: 'User created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Error creating user' });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await userDb.get('SELECT * FROM users WHERE username = ?', username);

    if (user) {
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (passwordMatch) {
        // Passwords match
        req.session.userId = user.id; // Store user ID in session
        req.session.username = user.username; // Store username in session
        res.status(200).send({ message: 'Login successful' });
      } else {
        // Passwords don't match
        res.status(401).send({ message: 'Invalid credentials' });
      }
    } else {
      // User not found
      res.status(401).send({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Error logging in' });
  }
});

// Logout endpoint
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      res.status(500).send({ message: 'Logout failed' });
    } else {
      res.redirect('/login.html');
    }
  });
});

let connectionCount = 0; // Track connection count
let connectionHandlerCount = 0; // Counter for io.on('connection', ...) executions

io.on('connection', async (socket) => {
  connectionHandlerCount++;
  console.log(`io.on('connection', ...) executed ${connectionHandlerCount} times`);
  console.log(`New connection. Total connections: ${connectionCount}`);
  console.log(`Socket ID: ${socket.id}`); // Log socket ID

  // Get username from session
  const username = socket.handshake.headers.username;
  const userId = socket.handshake.headers.userid;

  console.log(`User ${username} (ID: ${userId}) connected.`);

  socket.on('chat message', async (msg) => {
    // console.log(`Received message from ${username} (ID: ${userId}): ${msg}`);

    try {
      // Save message to the database
      console.log(`Saving message to database with userId: ${userId}`);
      await db.run('INSERT INTO messages (user_id, content) VALUES (?, ?)// filepath: c:\Users\minec\OneDrive\Documents\GitHub\gamerchat\index.js
import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Server } from 'socket.io';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcrypt';
import session from 'express-session'; // Import express-session
import crypto from 'crypto';

// Use user.db for user authentication
const userDb = await open({
  filename: 'user.db',
  driver: sqlite3.Database
});

// Create users table in user.db
await userDb.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  );
`);

const db = await open({
  filename: 'chat.db',
  driver: sqlite3.Database
});

await db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    content TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  connectionStateRecovery: {}
});

const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(express.static(join(__dirname, 'public')));
app.use(express.json());

// Session middleware
const secret = crypto.randomBytes(64).toString('hex');
app.use(session({
  secret: secret, // Replace with a strong, randomly generated secret
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true in production if using HTTPS
}));

// Middleware to check if user is logged in
const requireLogin = (req, res, next) => {
  if (req.session.userId) {
    next(); // User is logged in, proceed
  } else {
    res.redirect('/login.html'); // Redirect to login page
  }
};

app.get('/', requireLogin, (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

// Signup endpoint
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await userDb.run('INSERT INTO users (username, password) VALUES (?, ?)', username, hashedPassword);
    res.status(201).send({ message: 'User created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Error creating user' });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await userDb.get('SELECT * FROM users WHERE username = ?', username);

    if (user) {
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (passwordMatch) {
        // Passwords match
        req.session.userId = user.id; // Store user ID in session
        req.session.username = user.username; // Store username in session
        res.status(200).send({ message: 'Login successful' });
      } else {
        // Passwords don't match
        res.status(401).send({ message: 'Invalid credentials' });
      }
    } else {
      // User not found
      res.status(401).send({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Error logging in' });
  }
});

// Logout endpoint
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      res.status(500).send({ message: 'Logout failed' });
    } else {
      res.redirect('/login.html');
    }
  });
});

let connectionCount = 0; // Track connection count
let connectionHandlerCount = 0; // Counter for io.on('connection', ...) executions

io.on('connection', async (socket) => {
  connectionHandlerCount++;
  console.log(`io.on('connection', ...) executed ${connectionHandlerCount} times`);
  console.log(`New connection. Total connections: ${connectionCount}`);
  console.log(`Socket ID: ${socket.id}`); // Log socket ID

  // Get username from session
  const username = socket.handshake.headers.username;
  const userId = socket.handshake.headers.userid;

  console.log(`User ${username} (ID: ${userId}) connected.`);

  socket.on('chat message', async (msg) => {
    // console.log(`Received message from ${username} (ID: ${userId}): ${msg}`);

   // ... existing code ...

    try {
      // Save message to the database
      console.log(`Saving message to database with userId: ${userId}`);
      await db.run('INSERT INTO messages (user_id, content) VALUES (?, ?)`, userId, msg);