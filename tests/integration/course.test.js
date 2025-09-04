const request = require("supertest");
const mongoose = require("mongoose");
const { app } = require("../../index");
const Course = require("../../src/models/Course");
const jwt = require("jsonwebtoken");

describe("Course API", () => {
  let courseId;
  let token;

  beforeAll(() => {
    token = jwt.sign(
      { id: new mongoose.Types.ObjectId(), role: "student" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
  });

  beforeEach(async () => {
    await Course.deleteMany({});

    const course = await Course.create({
      _id: new mongoose.Types.ObjectId(),
      title: "Course A",
      sections: [
        {
          title: "Intro",
          order: 1,
          content: "Welcome to Course A",
        },
      ],
    });

    courseId = course._id.toString();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("fetches all courses", async () => {
    const res = await request(app)
      .get("/api/courses/getCourcesForStudent")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true); // ✅ check it's an array
  });

  it("fetches course by id", async () => {
    const res = await request(app)
      .get(`/api/courses/getCourse/${courseId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body._id).toBe(courseId);
  });
});
