package com.eventhub.user.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.eventhub.common.exception.BadRequestException;
import com.eventhub.user.dto.AvatarUploadResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class AvatarStorageService {
    private static final long MAX_FILE_SIZE_BYTES = 2L * 1024L * 1024L;
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of("image/jpeg", "image/png", "image/webp");

    private final Cloudinary cloudinary;
    private final String avatarFolder;

    public AvatarStorageService(
            @Value("${eventhub.cloudinary.url:}") String cloudinaryUrl,
            @Value("${eventhub.cloudinary.avatar-folder:eventhub/avatars}") String avatarFolder
    ) {
        this.cloudinary = cloudinaryUrl == null || cloudinaryUrl.isBlank() ? null : new Cloudinary(cloudinaryUrl);
        this.avatarFolder = avatarFolder == null || avatarFolder.isBlank() ? "eventhub/avatars" : avatarFolder;
    }

    public AvatarUploadResponse store(MultipartFile file, Long userId) {
        validate(file);
        if (cloudinary == null) {
            throw new BadRequestException("Avatar upload storage is not configured");
        }

        try {
            String publicId = "user-" + userId + "-" + UUID.randomUUID();
            Map<?, ?> result = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "folder", avatarFolder,
                    "public_id", publicId,
                    "resource_type", "image",
                    "overwrite", true
            ));
            Object secureUrl = result.get("secure_url");
            Object storedPublicId = result.get("public_id");
            if (secureUrl == null) {
                throw new BadRequestException("Could not store avatar");
            }
            return new AvatarUploadResponse(secureUrl.toString(), storedPublicId == null ? publicId : storedPublicId.toString());
        } catch (IOException ex) {
            throw new BadRequestException("Could not store avatar");
        }
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File is required");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new BadRequestException("Avatar size must be 2MB or smaller");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new BadRequestException("Only JPG, PNG and WEBP images are allowed");
        }
        String originalName = StringUtils.cleanPath(file.getOriginalFilename() == null ? "" : file.getOriginalFilename());
        if (originalName.contains("..")) {
            throw new BadRequestException("Invalid file name");
        }
    }
}
