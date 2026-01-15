import express from 'express';
import EventBudget from '../models/EventBudget.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// GET all budgets for a club
router.get('/club/:clubId', verifyToken, async (req, res) => {
    try {
        const budgets = await EventBudget.find({ clubId: req.params.clubId }).sort({ createdAt: -1 });
        res.json(budgets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET budget for a specific event
router.get('/event/:eventId', verifyToken, async (req, res) => {
    try {
        const budget = await EventBudget.findOne({ eventId: req.params.eventId });
        res.json(budget);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// CREATE or UPDATE budget (treasurer only)
router.post('/', verifyToken, async (req, res) => {
    try {
        const { eventId, clubId, budgetImages, createdBy } = req.body;

        // Check if budget already exists for this event
        const existingBudget = await EventBudget.findOne({ eventId });

        if (existingBudget) {
            // Update existing budget
            existingBudget.budgetImages = budgetImages;
            existingBudget.updatedAt = new Date();
            // Reset verification when budget is updated
            existingBudget.verified = false;
            existingBudget.verifiedBy = null;
            existingBudget.verifiedByName = null;
            existingBudget.verifiedAt = null;

            await existingBudget.save();
            res.json(existingBudget);
        } else {
            // Create new budget
            const newBudget = new EventBudget({
                eventId,
                clubId,
                budgetImages,
                createdBy,
            });
            await newBudget.save();
            res.status(201).json(newBudget);
        }
    } catch (error) {
        console.error('Error saving budget:', error);
        res.status(500).json({ message: error.message });
    }
});

// VERIFY budget (advisor only)
router.patch('/:id/verify', verifyToken, async (req, res) => {
    try {
        const { verifiedBy, verifiedByName } = req.body;

        const budget = await EventBudget.findByIdAndUpdate(
            req.params.id,
            {
                verified: true,
                verifiedBy,
                verifiedByName,
                verifiedAt: new Date(),
            },
            { new: true }
        );

        if (!budget) {
            return res.status(404).json({ message: 'Budget not found' });
        }

        res.json(budget);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE budget
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        await EventBudget.findByIdAndDelete(req.params.id);
        res.json({ message: 'Budget deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
