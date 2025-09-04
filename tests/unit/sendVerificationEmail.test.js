jest.mock("nodemailer");
const nodemailer = require("nodemailer");
const sendVerificationEmail = require("../../src/utils/sendVerificationEmail");

describe("sendVerificationEmail", () => {
    it("sends email with OTP", async () => {
        const sendMailMock = jest.fn().mockResolvedValue({});
        nodemailer.createTransport.mockReturnValue({ sendMail: sendMailMock });

        await sendVerificationEmail("user@example.com", "123456");

        expect(sendMailMock).toHaveBeenCalledWith(
            expect.objectContaining({
                to: "user@example.com",
                subject: "Your Email Verification OTP",
                html: expect.stringContaining("123456"),
            })
        );
    });
});
