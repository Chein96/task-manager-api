const request = require('supertest');
const app = require('../src/app');
const Task = require('../src/models/task');
const { authCredential, setupDatabase, taskThree } = require('./fixtures/db');

beforeEach(setupDatabase);

test('Should create task for user', async () => {
    const response = await request(app)
        .post('/tasks')
        .set('Authorization', authCredential)
        .send({
            description: 'Test Task'
        })
        .expect(201);
    const task = Task.findById(response.body._id);
    expect(task).not.toBeNull();
    expect(task.completed).toBeFalsy();
});

test('Should fetch user tasks', async () => {
    const response = await request(app)
        .get('/tasks')
        .set('Authorization', authCredential)
        .send()
        .expect(200);
    expect(response.body.length).toBe(2);
});

test('Should not delete user task of different user', async () => {
    await request(app)
        .delete(`/tasks/${taskThree._id}`)
        .set('Authorization', authCredential)
        .send()
        .expect(404);
    const task = await Task.findById(taskThree._id);
    expect(task).not.toBeNull();
});