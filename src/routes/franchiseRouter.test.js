const request = require("supertest");
const app = require("../service");
const { Role, DB } = require("../database/database.js");

const testUser = { name: randomName(), email: randomEmail(), password: "a" };
let testUserAuthToken;
let adminUserAuthToken;

beforeAll(async () => {
  const registerRes = await request(app).post("/api/auth").send(testUser);
  testUserAuthToken = registerRes.body.token;
  testUser.id = registerRes.body.user.id;

  const adminUser = await createAdminUser();
  const loginRes = await request(app)
    .put("/api/auth")
    .send({ email: adminUser.email, password: adminUser.password });
  expect(loginRes.status).toBe(200);
  adminUserAuthToken = loginRes.body.token;
});

test("create a franchise for the diner", async () => {
  const res = await request(app)
    .post("/api/franchise")
    .set("Authorization", `Bearer ${adminUserAuthToken}`)
    .send({
      name: randomName(),
      admins: [{ email: testUser.email }],
    });

  expect(res.status).toBe(200);
  expect(res.body).toMatchObject({
    id: expect.any(Number),
    name: expect.any(String),
    admins: expect.any(Array),
  });
});

test("create a franchise as the diner", async () => {
  const res = await request(app)
    .post("/api/franchise")
    .set("Authorization", `Bearer ${testUserAuthToken}`)
    .send({
      name: randomName(),
      admins: [{ email: testUser.email }],
    });

  expect(res.status).toBe(403);
  expect(res.body).toMatchObject({ message: "unable to create a franchise" });
});

test("delete a franchise", async () => {
  const createRes = await request(app)
    .post("/api/franchise")
    .set("Authorization", `Bearer ${adminUserAuthToken}`)
    .send({
      name: randomName(),
      admins: [{ email: testUser.email }],
    });

  const res = await request(app)
    .delete(`/api/franchise/${createRes.body.id}`)
    .set("Authorization", `Bearer ${adminUserAuthToken}`);

  expect(res.status).toBe(200);
  expect(res.body).toMatchObject({ message: "franchise deleted" });
});

test("get franchises", async () => {
  const res = await request(app)
    .get("/api/franchise")
    .set("Authorization", `Bearer ${adminUserAuthToken}`);

  expect(res.status).toBe(200);
  expect(res.body).toMatchObject({
    franchises: expect.any(Array),
  });
});

test("get user franchises as franchisee", async () => {
  await request(app)
    .post("/api/franchise")
    .set("Authorization", `Bearer ${adminUserAuthToken}`)
    .send({
      name: randomName(),
      admins: [{ email: testUser.email }],
    });

  const res = await request(app)
    .get(`/api/franchise/${testUser.id}`)
    .set("Authorization", `Bearer ${testUserAuthToken}`);

  expect(res.status).toBe(200);
  expect(res.body).toEqual(expect.any(Array));
});

test("get user franchises as admin", async () => {
  const res = await request(app)
    .get(`/api/franchise/${testUser.id}`)
    .set("Authorization", `Bearer ${adminUserAuthToken}`);

  expect(res.status).toBe(200);
  expect(res.body).toEqual(expect.any(Array));
});

test("create store", async () => {
  const franchiseRes = await request(app)
    .post("/api/franchise")
    .set("Authorization", `Bearer ${adminUserAuthToken}`)
    .send({
      name: randomName(),
      admins: [{ email: testUser.email }],
    });

  const res = await request(app)
    .post(`/api/franchise/${franchiseRes.body.id}/store`)
    .set("Authorization", `Bearer ${adminUserAuthToken}`)
    .send({
      name: randomName(),
      location: randomName(),
    });

  expect(res.status).toBe(200);
  expect(res.body).toMatchObject({
    id: expect.any(Number),
    name: expect.any(String),
  });
});

test("delete store", async () => {
    const franchiseRes = await request(app)
        .post("/api/franchise")
        .set("Authorization", `Bearer ${adminUserAuthToken}`)
        .send({
            name: randomName(),
            admins: [{ email: testUser.email }],
        });

    const storeRes = await request(app)
        .post(`/api/franchise/${franchiseRes.body.id}/store`)
        .set("Authorization", `Bearer ${adminUserAuthToken}`)
        .send({
            name: randomName(),
            location: randomName(),
        });

    const res = await request(app)
        .delete(`/api/franchise/${franchiseRes.body.id}/store/${storeRes.body.id}`)
        .set("Authorization", `Bearer ${adminUserAuthToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ message: "store deleted" });
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
