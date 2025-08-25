const { default: mongoose } = require("mongoose");
const User = require("../models/User");

const CourseRestriction = require("../models/CourseAssignment");
const Course = require("../models/Course");

exports.toggleUser = async (req, res) => {
    const { userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
    }

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: { isActive: !user.isActive } },
            { new: true }
        );

        res.status(200).json({
            message: `User ${updatedUser.name} is now ${updatedUser.isActive ? "active" : "inactive"}.`,
            user: updatedUser,
        });
    } catch (err) {
        console.error("Toggle user error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.getTeacherStudentsWithCourses = async (req, res) => {
    try {
        const teacherId = req.user.id;

        // ensure teacher
        const teacher = await User.findById(teacherId);
        if (!teacher || teacher.role !== "teacher") {
            return res.status(403).json({ error: "Only teachers can access this" });
        }

        // fetch teacher's students
        const students = await User.find({
            role: "student",
            teacher: teacherId,
            isActive: true,
        }).select("name email isActive createdAt");

        const studentIds = students.map((s) => s._id);

        // fetch available courses (teacher’s own + global + active)
        const availableCourses = await Course.find({
            $or: [{ createdBy: teacherId }, { isGlobal: true }],
            isActive: true,
        }).select("title description isGlobal createdBy isActive createdAt");

        // fetch restrictions for all students
        const restrictions = await CourseRestriction.find({
            teacherId,
            studentId: { $in: studentIds },
        }).populate("courseId", "title description isGlobal isActive createdAt");

        // organize restrictions by student
        const restrictionMap = {};
        restrictions.forEach((r) => {
            if (!restrictionMap[r.studentId]) {
                restrictionMap[r.studentId] = { assigned: [], restricted: [] };
            }
            if (r.restricted) {
                restrictionMap[r.studentId].restricted.push(r.courseId._id.toString());
            } else {
                restrictionMap[r.studentId].assigned.push(r.courseId._id.toString());
            }
        });

        // build final response per student
        const result = students.map((student) => {
            const assignedIds = restrictionMap[student._id]?.assigned || [];
            const restrictedIds = restrictionMap[student._id]?.restricted || [];

            // filter visible: all available - restricted + assigned
            let visibleCourses = availableCourses.filter(
                (course) =>
                    !restrictedIds.includes(course._id.toString()) ||
                    assignedIds.includes(course._id.toString())
            );

            // also prepare full objects for assigned/restricted
            const assignedCourses = availableCourses.filter((c) =>
                assignedIds.includes(c._id.toString())
            );
            const restrictedCourses = availableCourses.filter((c) =>
                restrictedIds.includes(c._id.toString())
            );

            return {
                _id: student._id,
                name: student.name,
                email: student.email,
                isActive: student.isActive,
                createdAt: student.createdAt,
                visibleCourses,
                assignedCourses,
                restrictedCourses,
            };
        });

        res.status(200).json(result);
    } catch (err) {
        console.error("Error fetching students with courses:", err);
        res.status(500).json({ error: "Failed to fetch students with courses" });
    }
};