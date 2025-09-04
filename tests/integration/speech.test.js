const mongoose = require("mongoose");
const request = require("supertest");
const { app } = require("../../index");
const Speech = require("../../src/models/SpeechPractise");

describe("Speech API", () => {
  beforeEach(async () => {
    await Speech.create({
      _id: new mongoose.Types.ObjectId(), // valid ObjectId
      title: "Greeting",                  // required field
      text: "Hello world",                // your test content
    });
  });

  it("fetches all speech", async () => {
    const res = await request(app).get("/api/speechPractise/"); // adjust route if needed
    expect(res.statusCode).toBe(200);
    expect(res.body[0].text).toBe("Hello world");
  });
});
