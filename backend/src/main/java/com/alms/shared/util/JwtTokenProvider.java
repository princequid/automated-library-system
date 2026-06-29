package com.alms.shared.util;

import com.alms.config.JwtConfig;
import com.alms.exception.AppException;
import com.alms.shared.enums.UserRole;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class JwtTokenProvider {

    private final JwtConfig jwtConfig;

    private SecretKey accessKey() {
        return Keys.hmacShaKeyFor(jwtConfig.getSecret().getBytes(StandardCharsets.UTF_8));
    }

    private SecretKey refreshKey() {
        return Keys.hmacShaKeyFor(jwtConfig.getRefreshSecret().getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(String userId, UserRole role, String email) {
        long expiryMs = (long) jwtConfig.getAccessTokenExpiryMinutes() * 60 * 1000;
        return Jwts.builder()
                .subject(userId)
                .claim("role", role.name())
                .claim("email", email)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiryMs))
                .signWith(accessKey())
                .compact();
    }

    public String generateRefreshToken(String userId, String jti) {
        long expiryMs = (long) jwtConfig.getRefreshTokenExpiryDays() * 24 * 60 * 60 * 1000;
        String tokenId = jti != null ? jti : UUID.randomUUID().toString();
        return Jwts.builder()
                .subject(userId)
                .id(tokenId)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiryMs))
                .signWith(refreshKey())
                .compact();
    }

    public Claims validateToken(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(accessKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (JwtException | IllegalArgumentException e) {
            throw new AppException("Invalid or expired token", HttpStatus.UNAUTHORIZED, e);
        }
    }

    public Claims validateRefreshToken(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(refreshKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (JwtException | IllegalArgumentException e) {
            throw new AppException("Invalid or expired refresh token", HttpStatus.UNAUTHORIZED, e);
        }
    }

    public Optional<Claims> parseClaimsSilently(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(accessKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return Optional.of(claims);
        } catch (Exception e) {
            return Optional.empty();
        }
    }
}
