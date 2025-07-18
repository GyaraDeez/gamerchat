import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Server } from 'socket.io';
import couchbase from 'couchbase';
import bcrypt from 'bcrypt';
import session from 'express-session';
import crypto from 'crypto';

// Couchbase Connection Details
const clusterConnStr = "couchbases://cb.bct3qyjlk64slyl8.cloud.couchbase.com"; // Replace this with Connection String
const username = "Gamerchat"; // Replace this with username from cluster access credentials
const password = "<<password>>"; // Replace this with password from cluster access credentials

// Couchbase references
let cluster;
let bucket;
let collection;
(async () => {
  try {
    cluster = await couchbase.connect(clusterConnStr, {
                username: username,
      password: password,
      configProfile: "wanDevelopment",
            });

    bucket = cluster.bucket("gamerchat"); // Replace with your bucket name
    collection = bucket.defaultCollection();

    console.log("Connected to Couchbase");
        } catch (error) {
    console.error("Failed to connect to Couchbase:", error);
    process.exit(1);
        }
})();

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
  secret: secret,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false
  }
}));

// Middleware to check if user is logged in
const requireLogin = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.redirect('/login.html');
  }
};

app.get('/', requireLogin, (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
    });

// Signup endpoint
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userDoc = {
      username: username,
      password: hashedPassword,
    };

    const insertResult = await collection.insert(username, userDoc); // Use username as the document ID

    res.status(201).json({ message: 'User created successfully', userId: username }); // Use username as userId
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: 'Error creating user - server error' });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const getResult = await collection.get(username);
    const user = getResult.content;

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials - user not found' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials - password incorrect' });
    }

    req.session.userId = username; // Store username in session
    req.session.username = username; // Store username in session
    res.status(200).json({ message: 'Login successful', userId: username }); // Use username as userId
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

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });
});

const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
