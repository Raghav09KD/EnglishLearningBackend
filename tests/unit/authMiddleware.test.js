const jwt = require("jsonwebtoken");
const { verifyToken, verifyAdmin } = require("../../src/middleware/authMiddleware");

describe("authMiddleware", () => {
  it("rejects if no token", () => {
    const req = { headers: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    verifyToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("calls next if token valid", () => {
    const user = { id: "u1", role: "student" };
    const token = jwt.sign(user, "testsecret");

    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = {};
    const next = jest.fn();

    process.env.JWT_SECRET = "testsecret";
    verifyToken(req, res, next);

    expect(req.user).toMatchObject(user);
    expect(next).toHaveBeenCalled();
  });

it("adminOnly rejects non-admin", () => {
  const user = { id: "u1", role: "student" };
  const token = jwt.sign(user, "testsecret");

  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  const next = jest.fn();

  process.env.JWT_SECRET = "testsecret";
  verifyAdmin(req, res, next);

  expect(res.status).toHaveBeenCalledWith(403);
});

it("adminOnly allows admin", () => {
  const user = { id: "u1", role: "admin" };
  const token = jwt.sign(user, "testsecret");

  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = {};
  const next = jest.fn();

  process.env.JWT_SECRET = "testsecret";
  verifyAdmin(req, res, next);

  expect(next).toHaveBeenCalled();
});

});
