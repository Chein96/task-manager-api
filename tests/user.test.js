const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/user');
const { userOne, authCredential, setupDatabase } = require('./fixtures/db');

beforeEach(setupDatabase);

test('Should sign up a new user', async () => {
    const response = await request(app).post('/users').send({
        name: 'Mike',
        email: 'mike@test.com',
        password: 'MikePass123'
    }).expect(201);

    // Assert that the database was changed correctly
    const user = await User.findById(response.body.user._id);
    expect(user).not.toBeNull();

    // Assertions about the response
    expect(response.body).toMatchObject({
        user: {
            name: 'Mike',
            email: 'mike@test.com'
        },
        token: user.tokens[0].token
    });

    // Assert that the password has been transformed
    expect(user.password).not.toBe('MikePass123');
});

test('Should login existing user', async () => {
    const response = await request(app).post('/users/login').send({
        email: userOne.email,
        password: userOne.password
    }).expect(200);

    const user = await User.findById(userOne._id);
    expect(user.tokens[1].token).toBe(response.body.token);
});

test('Should not login non-existent user', async () => {
    await request(app).post('/users/login').send({
        email: 'unknown@test.com',
        password: 'unknown123ABC'
    }).expect(400);
});

test('Should get profile for user', async () => {
    await request(app)
        .get('/users/me')
        .set('Authorization', authCredential)
        .send()
        .expect(200);
});

test('Should not get profile for unauthenticated user', async () => {
    await request(app)
        .get('/users/me')
        .send()
        .expect(401);
});

test('Should delete account for user', async () => {
    await request(app)
        .delete('/users/me')
        .set('Authorization', authCredential)
        .send()
        .expect(200);
    const user = await User.findById(userOne._id);
    expect(user).toBeNull();
});

test('Should not delete account for unauthenticated user', async () => {
    await request(app)
        .delete('/users/me')
        .send()
        .expect(401);
});

test('Should upload avatar image', async () => {
    await request(app)
        .post('/users/me/avatar')
        .set('Authorization', authCredential)
        .attach('avatar', 'tests/fixtures/profile-pic.jpg')
        .expect(200);
    const user = await User.findById(userOne._id);
    expect(user.avatar).toEqual(expect.any(Buffer));
});

test('Should update valid user fields', async () => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', authCredential)
        .send({
            name: 'Miguel'
        })
        .expect(200);
    const user = await User.findById(userOne._id);
    expect(user.name).toEqual('Miguel');
});

test('Should not update invalid user fields', async () => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', authCredential)
        .send({
            location: 'Mexicali'
        })
        .expect(400);
});