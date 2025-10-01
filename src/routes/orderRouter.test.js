const request = require("supertest");
const app = require("../service");
const { Role, DB } = require("../database/database.js");

const testUser = { name: randomName(), email: randomEmail(), password: "a" };
let testUserAuthToken;

beforeAll(async () => {
  const registerRes = await request(app).post("/api/auth").send(testUser);
  testUserAuthToken = registerRes.body.token;
});

test("get menu", async () => {
  const res = await request(app).get("/api/order/menu");
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
});

test("add menu item as diner", async () => {
  const res = await request(app)
    .put("/api/order/menu")
    .set("Authorization", `Bearer ${testUserAuthToken}`)
    .send({
      name: "Test Item",
      description: "Test Description",
      price: 9.99,
    });
  expect(res.status).toBe(403);
  expect(res.body).toMatchObject({ message: "unable to add menu item" });
});

test("add menu item as admin", async () => {
  const adminUser = await createAdminUser();

  const loginRes = await request(app)
    .put("/api/auth")
    .send({ email: adminUser.email, password: adminUser.password });
  adminUser.token = loginRes.body.token;

  const res = await request(app)
    .put("/api/order/menu")
    .set("Authorization", `Bearer ${adminUser.token}`)
    .send({
      title: "Test Item",
      description: "Test Description",
      image: "http://example.com/image.png",
      price: 9.99,
    });
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
});

test("get orders as diner", async () => {
  const res = await request(app)
    .get("/api/order")
    .set("Authorization", `Bearer ${testUserAuthToken}`);

  expect(res.status).toBe(200);
  expect(res.body).toMatchObject({
    dinerId: expect.any(Number),
    orders: expect.any(Array),
    page: expect.any(Number),
  });
});

function randomName() {
  return Math.random().toString(36).substring(2, 12);
}

function randomEmail() {
  return `${randomName()}@test.com`;
}

async function createAdminUser() {
  let user = { password: "a", roles: [{ role: Role.Admin }] };
  user.name = randomName();
  user.email = `${user.name}@admin.com`;

  user = await DB.addUser(user);
  return { ...user, password: "a" };
}
