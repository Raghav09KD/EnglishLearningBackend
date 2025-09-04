const speechController = require("../../src/controllers/speechPractise.controller");
const SpeechPractice = require("../../src/models/SpeechPractise");
const User = require("../../src/models/User");

// Mock dependencies
jest.mock("../../src/models/SpeechPractise");
jest.mock("../../src/models/User");
jest.mock("../../src/utils/utils", () => ({
  calculatePronunciationScore: jest.fn(() => ({
    score: 100,
    totalExpected: 5,
    correct: 5,
  })),
}));

describe("speechPractise.controller", () => {
  it("getAllSpeechPractices returns list for admin", async () => {
    const req = { user: { id: "u1", role: "admin" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    // Mock User.findById with populate
    User.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue({ role: "admin" }),
    });

    // Mock SpeechPractice.find chain
    SpeechPractice.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue([{ _id: "s1", text: "hello" }]),
    });

    await speechController.getAllSpeechPractices(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([{ _id: "s1", text: "hello" }]);
  });
});
