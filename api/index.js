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
let userDb;
try {
  userDb = await open({
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
  } catch (error) {
  console.error("Database initialization error:", error);
  process.exit(1); // Exit if database fails to initialize
  }

let db;
  try {
  db = await open({
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
  } catch (error) {
  console.error("Chat database initialization error:", error);
  process.exit(1); // Exit if database fails to initialize
  }

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
    const result = await userDb.run('INSERT INTO users (username, password) VALUES (?, ?)', username, hashedPassword);
     // Get the last inserted ID
    const user = await userDb.get('SELECT * FROM users WHERE username = ?', username);

    res.status(201).send({ message: 'User created successfully', userId: user.id });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: 'Error creating user - server error' });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await userDb.get('SELECT * FROM users WHERE username = ?', username);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials - user not found' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials - password incorrect' });
    }
    req.session.userId = user.id; // Store user ID in session
    req.session.username = user.username; // Store username in session
    res.status(200).json({ message: 'Login successful', userId: user.id });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: 'Error logging in - server error' });
  }
  });

// Logout endpoint
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      res.status(500).json({ message: 'Logout failed' });
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
      await db.run('INSERT INTO messages (user_id, content) VALUES (?, ?)', userId, msg);

      // Emit the message to all connected clients
      io.emit('chat message', {
        content: msg,
        username: username,
        userId: userId,
        timestamp: new Date()
});
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  socket.on('disconnect', () => {
    connectionCount--;
    console.log(`User ${username} (ID: ${userId}) disconnected. Total connections: ${connectionCount}`);
  });
});

const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
