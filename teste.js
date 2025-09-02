import nodemailer from 'nodemailer';
import { google } from 'googleapis';

async function testEmail() {
  try {
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI
    );

    oAuth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
    const accessTokenObj = await oAuth2Client.getAccessToken();

    console.log("AccessToken:", accessTokenObj);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.GMAIL_EMAIL,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
        accessToken: accessTokenObj.token || accessTokenObj,
      },
    });

    let info = await transporter.sendMail({
      from: `"Teste Email" <${process.env.GMAIL_EMAIL}>`,
      to: process.env.GMAIL_EMAIL,
      subject: "Teste Nodemailer OAuth2",
      text: "Se você receber este email, OAuth2 está funcionando.",
    });

    console.log("Mensagem enviada:", info.messageId);
  } catch (err) {
    console.error("Erro ao enviar e-mail:", err);
  }
}

testEmail();
