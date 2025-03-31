const express = require('express');
const router = express.Router();
const NexusEvent = require('../models/NexusEvent');

// Get all nexus events
router.get('/', async (req, res) => {
  try {
    const events = await NexusEvent.find();
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single nexus event
router.get('/:id', async (req, res) => {
  try {
    const event = await NexusEvent.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Nexus event not found' });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new nexus event
router.post('/', async (req, res) => {
  const event = new NexusEvent(req.body);
  try {
    const newEvent = await event.save();
    res.status(201).json(newEvent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a nexus event
router.patch('/:id', async (req, res) => {
  try {
    const event = await NexusEvent.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Nexus event not found' });
    }
    Object.assign(event, req.body);
    const updatedEvent = await event.save();
    res.json(updatedEvent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a nexus event
router.delete('/:id', async (req, res) => {
  try {
    const event = await NexusEvent.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Nexus event not found' });
    }
    await event.remove();
    res.json({ message: 'Nexus event deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 