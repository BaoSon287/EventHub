package com.eventhub.event.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.eventhub.common.exception.BadRequestException;
import com.eventhub.event.dto.EventImageUploadResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class EventImageStorageService {
    private static final long MAX_FILE_SIZE_BYTES = 5L * 1024L * 1024L;
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of("image/jpeg", "image/png", "image/webp");
    private static final Map<String, String> EXTENSIONS_BY_CONTENT_TYPE = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp"
    );

    private final Path uploadDir;
    private final String publicBaseUrl;
    private final String publicPath;
    private final Cloudinary cloudinary;
    private final String cloudinaryFolder;

    public EventImageStorageService(
            @Value("${eventhub.upload.event-image-dir:uploads/events}") String uploadDir,
            @Value("${eventhub.upload.public-base-url:http://localhost:8080}") String publicBaseUrl,
            @Value("${eventhub.upload.event-image-public-path:/api/events/uploads/events}") String publicPath,
            @Value("${eventhub.cloudinary.url:}") String cloudinaryUrl,
            @Value("${eventhub.cloudinary.folder:eventhub/events}") String cloudinaryFolder
    ) {
        this.uploadDir = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.publicBaseUrl = trimTrailingSlash(publicBaseUrl);
        this.publicPath = publicPath.startsWith("/") ? publicPath : "/" + publicPath;
        this.cloudinary = cloudinaryUrl == null || cloudinaryUrl.isBlank() ? null : new Cloudinary(cloudinaryUrl);
        this.cloudinaryFolder = cloudinaryFolder == null || cloudinaryFolder.isBlank() ? "eventhub/events" : cloudinaryFolder;
    }

    public EventImageUploadResponse store(MultipartFile file) {
        validate(file);

        if (cloudinary != null) {
            return storeInCloudinary(file);
        }

        try {
            Files.createDirectories(uploadDir);
            String extension = extensionFor(file);
            String fileName = UUID.randomUUID() + extension;
            Path target = uploadDir.resolve(fileName).normalize();

            if (!target.startsWith(uploadDir)) {
                throw new BadRequestException("Invalid upload path");
            }

            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            return new EventImageUploadResponse(publicBaseUrl + publicPath + "/" + fileName, fileName);
        } catch (IOException ex) {
            throw new BadRequestException("Could not store event image");
        }
    }

    public Path getUploadDir() {
        return uploadDir;
    }

    private EventImageUploadResponse storeInCloudinary(MultipartFile file) {
        try {
            String publicId = UUID.randomUUID().toString();
            Map<?, ?> result = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "folder", cloudinaryFolder,
                    "public_id", publicId,
                    "resource_type", "image"
            ));
            Object secureUrl = result.get("secure_url");
            Object storedPublicId = result.get("public_id");
            if (secureUrl == null) {
                throw new BadRequestException("Could not store event image");
            }
            return new EventImageUploadResponse(secureUrl.toString(), storedPublicId == null ? publicId : storedPublicId.toString());
        } catch (IOException ex) {
            throw new BadRequestException("Could not store event image");
        }
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File is required");
        }

        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new BadRequestException("Image size must be 5MB or smaller");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new BadRequestException("Only JPG, PNG and WEBP images are allowed");
        }

        String originalName = StringUtils.cleanPath(file.getOriginalFilename() == null ? "" : file.getOriginalFilename());
        if (originalName.contains("..")) {
            throw new BadRequestException("Invalid file name");
        }

        String lowerName = originalName.toLowerCase(Locale.ROOT);
        boolean allowedExtension = lowerName.endsWith(".jpg")
                || lowerName.endsWith(".jpeg")
                || lowerName.endsWith(".png")
                || lowerName.endsWith(".webp")
                || lowerName.isBlank();
        if (!allowedExtension) {
            throw new BadRequestException("Only JPG, PNG and WEBP images are allowed");
        }
    }

    private String extensionFor(MultipartFile file) {
        String contentType = file.getContentType();
        return EXTENSIONS_BY_CONTENT_TYPE.getOrDefault(
                contentType == null ? "" : contentType.toLowerCase(Locale.ROOT),
                ".jpg"
        );
    }

    private String trimTrailingSlash(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
