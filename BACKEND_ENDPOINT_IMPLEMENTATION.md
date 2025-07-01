# Backend Implementation for GET /api/users endpoint

## Add this route to your backend (Express.js example):

```javascript
// In your users router file (e.g., routes/users.js)
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth'); // adjust path as needed
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/users - Get all users
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { active = 'true', role } = req.query;
    
    // Build where clause
    const whereClause = {};
    
    // Filter by active status
    if (active === 'true') {
      whereClause.isActive = true;
    }
    
    // Filter by role if specified
    if (role && ['MEMBER', 'ADMIN', 'MODERATOR'].includes(role)) {
      whereClause.role = role;
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        isActive: true,
        isOnline: true,
        lastSeen: true,
        createdAt: true,
        updatedAt: true,
        // Exclude sensitive fields
      },
      where: whereClause,
      orderBy: {
        username: 'asc'
      }
    });

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      error: 'Failed to fetch users',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
```

## Or if you're using a controller pattern:

```javascript
// In your users controller (e.g., controllers/userController.js)
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAllUsers = async (req, res) => {
  try {
    const { active = 'true', role } = req.query;
    
    const whereClause = {};
    
    if (active === 'true') {
      whereClause.isActive = true;
    }
    
    if (role && ['MEMBER', 'ADMIN', 'MODERATOR'].includes(role)) {
      whereClause.role = role;
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        isActive: true,
        isOnline: true,
        lastSeen: true,
        createdAt: true,
        updatedAt: true,
      },
      where: whereClause,
      orderBy: {
        username: 'asc'
      }
    });

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      error: 'Failed to fetch users',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};
```

## Then register the route in your main app file:

```javascript
// In your main app.js or server.js
const userRoutes = require('./routes/users'); // adjust path as needed

// Register the route
app.use('/api/users', userRoutes);
```

## Or if using controller pattern:

```javascript
// In your routes file
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, userController.getAllUsers);

module.exports = router;
```
