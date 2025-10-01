const request = require('supertest');
const app = require('../service');

const testUser = { name: randomName(), email: randomEmail(), password: 'a' };
let testUserAuthToken;

beforeAll(async () => {
  const registerRes = await request(app).post('/api/auth').send(testUser);
  testUserAuthToken = registerRes.body.token;
  expectValidJwt(testUserAuthToken);
});

test('register', async () => {
  const newUser = { name: randomName(), email: randomEmail(), password: 'a' };
  const res = await request(app).post('/api/auth').send(newUser);
  expect(res.status).toBe(200);
  expectValidJwt(res.body.token);

  const expectedUser = { ...newUser, roles: [{ role: 'diner' }] };
  delete expectedUser.password;
  expect(res.body.user).toMatchObject(expectedUser);
});

test('bad register', async () => {
  const res = await request(app).post('/api/auth').send({ name: 'x', email: 'y' });
  expect(res.status).toBe(400);
  expect(res.body).toMatchObject({ message: 'name, email, and password are required' });
});

test('login and logout', async () => {
  const loginRes = await request(app).put('/api/auth').send(testUser);
  expect(loginRes.status).toBe(200);
  expectValidJwt(loginRes.body.token);

  const expectedUser = { ...testUser, roles: [{ role: 'diner' }] };
  delete expectedUser.password;
  expect(loginRes.body.user).toMatchObject(expectedUser);

  const logoutRest = await request(app)
    .delete('/api/auth')
    .set('Authorization', `Bearer ${loginRes.body.token}`);
  expect(logoutRest.status).toBe(200);
  expect(logoutRest.body).toMatchObject({ message: 'logout successful' });
});

function randomName() {
  return Math.random().toString(36).substring(2, 12);
}

function randomEmail() {
  return `${randomName()}@test.com`;
}

function expectValidJwt(token) {
  expect(token).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);
}
