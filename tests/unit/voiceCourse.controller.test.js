jest.mock("../src/models/User");
jest.mock("../models/VoiceCourse");
jest.mock("../models/VoiceProgress");

const voiceController = require("../../src/controllers/voiceCourse.controller");
const VoiceCourse = require("../../src/models/VoiceCourse");
const User = require("../../src/models/User");
const UserVoiceCourseProgress = require("../../src/models/VoiceProgress");

describe("voiceCourse.controller", () => {
  it("getAllCourses returns list", async () => {
    const req = { user: { id: "u1", role: "admin" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    // Mock User.findById
    User.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue({ _id: "u1", role: "admin", voiceCourses: [] }),
    });

    // Mock VoiceCourse.find chain
    VoiceCourse.find.mockReturnValue({
      select: jest.fn().mockResolvedValue([{ _id: "v1", title: "Voice A", isActive: true }]),
    });

    // Mock UserVoiceCourseProgress.find
    UserVoiceCourseProgress.find.mockReturnValue({
      select: jest.fn().mockResolvedValue([]),
    });

    await voiceController.getAllCourses(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([
      { _id: "v1", title: "Voice A", isCompleted: false, isActive: true },
    ]);
  });
});
