package com.eventhub.auth.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;

import java.nio.charset.StandardCharsets;

@Service
public class EmailService {
    private final JavaMailSender mailSender;
    private final String mailFrom;
    private final String frontendUrl;
    private final String mailUsername;
    private final String mailPassword;

    public EmailService(
            JavaMailSender mailSender,
            @Value("${eventhub.mail.from}") String mailFrom,
            @Value("${eventhub.mail.frontend-url}") String frontendUrl,
            @Value("${spring.mail.username:}") String mailUsername,
            @Value("${spring.mail.password:}") String mailPassword
    ) {
        this.mailSender = mailSender;
        this.mailFrom = mailFrom;
        this.frontendUrl = frontendUrl;
        this.mailUsername = mailUsername;
        this.mailPassword = mailPassword;
    }

    public void sendVerificationEmail(String userEmail, String token) {
        String link = UriComponentsBuilder.fromUriString(frontendUrl)
                .path("/verify-email")
                .queryParam("token", token)
                .build()
                .toUriString();
        sendSimpleMail(
                userEmail,
                "Verify your EventHub account",
                buildActionEmail("Verify your EventHub account", "Click the button below to verify your email address.", "Verify email", link)
        );
    }

    public void sendPasswordResetEmail(String userEmail, String token) {
        String link = UriComponentsBuilder.fromUriString(frontendUrl)
                .path("/reset-password")
                .queryParam("token", token)
                .build()
                .toUriString();
        sendSimpleMail(
                userEmail,
                "Reset your EventHub password",
                buildActionEmail("Reset your EventHub password", "This link expires in 15 minutes.", "Reset password", link)
        );
    }

    public void sendSimpleMail(String to, String subject, String htmlContent) {
        validateMailConfiguration();
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
            helper.setFrom(mailFrom);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailSender.send(message);
        } catch (MailException ex) {
            throw new IllegalStateException("Could not send email", ex);
        } catch (MessagingException ex) {
            throw new IllegalStateException("Could not build email message", ex);
        }
    }

    private void validateMailConfiguration() {
        if (mailUsername == null || mailUsername.isBlank()) {
            throw new IllegalStateException("MAIL_USERNAME is not configured");
        }
        if (mailPassword == null || mailPassword.isBlank()) {
            throw new IllegalStateException("MAIL_PASSWORD is not configured");
        }
        if (mailFrom == null || mailFrom.isBlank() || mailFrom.endsWith("@eventhub.local")) {
            throw new IllegalStateException("MAIL_FROM is not configured");
        }
    }

    private String buildActionEmail(String title, String message, String buttonText, String link) {
        return """
                <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
                  <h2>%s</h2>
                  <p>%s</p>
                  <p>
                    <a href="%s" style="display:inline-block;background:#4f46e5;color:#ffffff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700">
                      %s
                    </a>
                  </p>
                  <p style="font-size:12px;color:#64748b">If the button does not work, copy and paste this link into your browser:</p>
                  <p style="font-size:12px;color:#475569;word-break:break-all">%s</p>
                </div>
                """.formatted(title, message, link, buttonText, link);
    }
}
