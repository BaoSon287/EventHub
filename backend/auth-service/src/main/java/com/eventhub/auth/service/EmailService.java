package com.eventhub.auth.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;
import java.util.Map;

@Service
public class EmailService {
    private final RestClient restClient;
    private final String resendApiKey;
    private final String mailFrom;
    private final String frontendUrl;

    public EmailService(
            @Value("${eventhub.mail.resend-api-url}") String resendApiUrl,
            @Value("${eventhub.mail.resend-api-key}") String resendApiKey,
            @Value("${eventhub.mail.from}") String mailFrom,
            @Value("${eventhub.mail.frontend-url}") String frontendUrl
    ) {
        this.restClient = RestClient.builder()
                .baseUrl(resendApiUrl)
                .build();
        this.resendApiKey = resendApiKey;
        this.mailFrom = mailFrom;
        this.frontendUrl = frontendUrl;
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
            restClient.post()
                    .uri("/emails")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + resendApiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "from", mailFrom,
                            "to", List.of(to),
                            "subject", subject,
                            "html", htmlContent
                    ))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException ex) {
            throw new IllegalStateException(
                    "Email API returned " + ex.getStatusCode() + ": " + trimResponse(ex.getResponseBodyAsString()),
                    ex
            );
        } catch (RestClientException ex) {
            throw new IllegalStateException("Could not call email API", ex);
        }
    }

    private void validateMailConfiguration() {
        if (resendApiKey == null || resendApiKey.isBlank()) {
            throw new IllegalStateException("RESEND_API_KEY is not configured");
        }
        if (mailFrom == null || mailFrom.isBlank() || mailFrom.endsWith("@eventhub.local")) {
            throw new IllegalStateException("MAIL_FROM is not configured");
        }
    }

    private String trimResponse(String responseBody) {
        if (responseBody == null || responseBody.isBlank()) {
            return "empty response";
        }
        String compact = responseBody.replaceAll("\\s+", " ").trim();
        return compact.length() > 500 ? compact.substring(0, 500) + "..." : compact;
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
