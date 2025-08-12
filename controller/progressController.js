
async function getUserVoiceCourseProgress(userId) {
    const progressRecords = await UserVoiceCourseProgressSchema.find({
        userId
    }).lean();

    if (!progressRecords || progressRecords.length === 0) {
        return [];
    }

    const result = await Promise.all(progressRecords.map(async (progress) => {
        const course = await VoiceCourse.findById(progress.courseId).lean();
        if (!course) return null;

        const quizDetails = course.quiz.map((q, idx) => {
            const selected = progress.submittedAnswers[idx];
            return {
                question: q.question,
                options: q.options,
                correctAnswer: q.correctAnswer,
                selectedAnswer: selected,
                isCorrect: selected === q.correctAnswer
            };
        });

        return {
            courseId: course._id,
            courseTitle: course.title,
            score: progress.score,
            totalQuestions: progress.totalQuestions,
            quizDetails
        };
    }));

    return result.filter(Boolean);
}


async function getUserVoiceCourseProgress(userId) {

}


module.exports = {
    getUserVoiceCourseProgress
};