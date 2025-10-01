const request = require("supertest");
const { DB } = require("./database/database.js");
const app = require("./service");

beforeAll(async () => {
  await DB.initialized;
});

test("docs", async () => {
  const res = await request(app).get("/api/docs");
  expect(res.status).toBe(200);

  expect(res.body).toHaveProperty("version");
  expect(res.body).toHaveProperty("endpoints");
  expect(res.body).toHaveProperty("config");
  expect(res.body.config).toHaveProperty("factory");
  expect(res.body.config).toHaveProperty("db");
});

test("root", async () => {
  const res = await request(app).get("/");
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty("message", "welcome to JWT Pizza");
  expect(res.body).toHaveProperty("version");
});

test("unknown", async () => {
  const res = await request(app).get("/unknown");
  expect(res.status).toBe(404);
  expect(res.body).toHaveProperty("message", "unknown endpoint");
});