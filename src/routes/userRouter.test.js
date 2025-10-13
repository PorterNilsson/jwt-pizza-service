const request = require("supertest");
const app = require("../service");
const { Role, DB } = require("../database/database.js");

let adminUserAuthToken;

beforeAll(async () => {
  const adminUser = await createAdminUser();
  const loginRes = await request(app)
    .put("/api/auth")
    .send({ email: adminUser.email, password: adminUser.password });
  expect(loginRes.status).toBe(200);
  adminUserAuthToken = loginRes.body.token;
});

test("list users unauthorized", async () => {
  const listUsersRes = await request(app).get("/api/user");
  expect(listUsersRes.status).toBe(401);
});

test("list users", async () => {
  const listUsersRes = await request(app)
    .get("/api/user")
    .set("Authorization", `Bearer ${adminUserAuthToken}`);
  expect(listUsersRes.status).toBe(200);
});

function randomName() {
  return Math.random().toString(36).substring(2, 12);
}

async function createAdminUser() {
  let user = { password: "admin", roles: [{ role: Role.Admin }] };
  user.name = randomName();
  user.email = `${user.name}@admin.com`;

  user = await DB.addUser(user);
  return { ...user, password: "admin" };
}
