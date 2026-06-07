package com.eventhub.auth.security;

import com.eventhub.auth.entity.AuthUser;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
    public String generateToken(AuthUser user) {
        return "jwt-placeholder-for-user-" + user.getId();
    }
}
