const express = require('express');
const Task = require('../models/task');
const auth = require('../middleware/auth');

const router = new express.Router();

// REST API - TASKS ----------
// Create Task
router.post('/tasks', auth, async (req, res) => {
    const task = new Task({
        ...req.body,
        owner: req.user._id
    });

    try{
        await task.save();
        res.status(201).send(task);
    }catch(e){
        res.status(400).send(e);
    }
});

// Get Tasks, /tasks?completed=true
// Get Tasks, /tasks?limit=10&skip=3 (#4 -> #13)
// Get Tasks, /tasks?sortBy=createdAt:desc
router.get('/tasks', auth, async (req, res) => {
    const { completed, limit, skip, sortBy } = req.query;
    const match = {};
    const sort = {};

    if(completed) {
        match.completed = completed === 'true';
    }

    if(sortBy) {
        const [ property, order ] = req.query.sortBy.split(':');
        sort[property] = order === 'desc' ? -1 : 1;
    }

    try{
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(limit),
                skip: parseInt(skip),
                sort
            }
        }).execPopulate();
        res.send(req.user.tasks);
    }catch(e){
        res.status(500).send();
    }
});

// Get Task
router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id;

    try{
        const task = await Task.findOne({ _id, owner: req.user._id });
        if(!task){
            return res.status(404).send();
        }
        res.send(task);
    }catch(e){
        res.status(500).send(e);
    }
});

// Update Task
router.patch('/tasks/:id', auth, async (req,res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['description', 'completed'];
    const isValidUpdate = updates.every((update) => allowedUpdates.includes(update));
    if(!isValidUpdate){
        return res.status(400).send({ error: 'Invalid updates!' });
    }

    try{
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });

        if(!task){
            return res.status(404).send();
        }

        updates.forEach((update) => task[update] = req.body[update]);
        await task.save();
        res.send(task);
    }catch(e){
        res.status(400).send(e);
    }
});

// Delete Task
router.delete('/tasks/:id', auth, async (req, res) => {
    try{
        const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
        if(!task){
            return res.status(404).send();
        }
        res.send(task);
    }catch(e){
        res.status(500).send(e);
    }
});

module.exports = router;