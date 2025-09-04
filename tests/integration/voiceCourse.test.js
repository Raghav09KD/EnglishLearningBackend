const request = require("supertest");
const { app } = require("../../index");
const VoiceCourse = require("../../src/models/VoiceCourse");
const mongoose = require("mongoose");

describe("VoiceCourse API", () => {
  beforeEach(async () => {
    await VoiceCourse.create({
      _id: new mongoose.Types.ObjectId(),
      title: "Voice Course A",
      mp3File: "test.mp3",
    });
  });

  it("fetches voice courses", async () => {
    const res = await request(app).get("/api/voicePractise");
    expect(res.statusCode).toBe(200);
    expect(res.body[0].title).toBe("Voice Course A");
  });
});