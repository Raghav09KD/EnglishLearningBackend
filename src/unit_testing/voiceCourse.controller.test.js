const voiceController = require("../controllers/voiceCourse.controller");
const VoiceCourse = require("../models/VoiceCourse");
const User = require("../models/User");
const UserVoiceCourseProgress = require("../models/VoiceProgress");

jest.mock("../models/VoiceCourse");
jest.mock("../models/User");
jest.mock("../models/VoiceProgress");

describe("voiceCourse.controller", () => {
  it("getAllCourses returns list", async () => {
    const req = { user: { id: "u1", role: "admin" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    // Mock User.findById with populate
    User.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue({ role: "admin", voiceCourses: [] }),
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
