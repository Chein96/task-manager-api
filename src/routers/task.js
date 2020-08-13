const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
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

// Upload Task Image
const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb){
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
            cb(new Error('Please upload a valid image format.'));
        }

        cb(undefined, true);
    }
});

router.post('/tasks/:id/image', auth, upload.single('image'), async (req, res) => {
    const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });

    if(!task) {
        return res.status(404).send();
    }

    const buffer = await sharp(req.file.buffer).png().toBuffer();
    task.image = buffer;
    await task.save();
    res.send();
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message });
});

// Delete Task Image
router.delete('/tasks/:id/image', auth, async (req, res) => {
    const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });
    if(!task) {
        return res.status(404).send();
    }
    task.image = undefined;
    await task.save();
    res.send();
});

// Get Task Image
router.get('/tasks/:id/image', auth, async (req, res) => {
    try {
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });

        if(!task || !task.image){
            throw new Error();
        }
        
        res.set('Content-Type', 'image/png');
        res.send(task.image);
    } catch(e) {
        res.status(404).send();
    }
});

module.exports = router;