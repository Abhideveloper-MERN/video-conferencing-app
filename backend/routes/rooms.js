const express = require('express');
const Room = require('../models/Room');
const auth = require('../middleware/auth');
const router = express.Router();

// Create room
router.post('/', auth, async (req, res) => {
  try {
    const { roomName } = req.body;
    const roomId = Math.random().toString(36).substring(2, 15);
    
    const room = new Room({
      roomId,
      roomName,
      createdBy: req.user.userId
    });
    
    await room.save();
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's rooms
router.get('/my-rooms', auth, async (req, res) => {
  try {
    const rooms = await Room.find({ 
      createdBy: req.user.userId 
    }).sort({ createdAt: -1 });
    
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get room by ID
router.get('/:roomId', async (req, res) => {
  try {
    const room = await Room.findOne({ 
      roomId: req.params.roomId 
    }).populate('createdBy', 'username');
    
    if (!room) {
      return res.status(404).json({ 
        message: 'Room not found' 
      });
    }
    
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 