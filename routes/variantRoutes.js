const express = require('express');
const router = express.Router();
const Variant = require('../models/Variant');

// Get all variants
router.get('/', async (req, res) => {
  try {
    const variants = await Variant.find();
    res.json(variants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single variant
router.get('/:id', async (req, res) => {
  try {
    const variant = await Variant.findById(req.params.id);
    if (!variant) {
      return res.status(404).json({ message: 'Variant not found' });
    }
    res.json(variant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new variant
router.post('/', async (req, res) => {
  const variant = new Variant(req.body);
  try {
    const newVariant = await variant.save();
    res.status(201).json(newVariant);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a variant
router.patch('/:id', async (req, res) => {
  try {
    const variant = await Variant.findById(req.params.id);
    if (!variant) {
      return res.status(404).json({ message: 'Variant not found' });
    }
    Object.assign(variant, req.body);
    const updatedVariant = await variant.save();
    res.json(updatedVariant);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a variant
router.delete('/:id', async (req, res) => {
  try {
    const variant = await Variant.findById(req.params.id);
    if (!variant) {
      return res.status(404).json({ message: 'Variant not found' });
    }
    await variant.remove();
    res.json({ message: 'Variant deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 