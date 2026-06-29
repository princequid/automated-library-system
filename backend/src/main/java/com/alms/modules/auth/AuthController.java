package com.alms.modules.auth;

import com.alms.modules.auth.dto.LoginRequest;
import com.alms.modules.auth.dto.LoginResponse;
import com.alms.modules.auth.dto.PasswordResetRequest;
import com.alms.modules.auth.dto.RefreshResponse;
import com.alms.modules.auth.dto.SsoCallbackRequest;
import com.alms.modules.auth.dto.TwoFactorRequest;
import com.alms.shared.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@Tag(name = "Authentication")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "Login with email and password")
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(authService.login(request), "Login successful"));
    }

    @Operation(summary = "Verify TOTP code")
    @PostMapping("/2fa/verify")
    public ResponseEntity<ApiResponse<LoginResponse>> verifyTotp(@Valid @RequestBody TwoFactorRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(authService.verifyTotp(request), "2FA verified"));
    }

    @Operation(summary = "Refresh access token")
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<RefreshResponse>> refresh(
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
        return ResponseEntity.ok(ApiResponse.ok(authService.refresh(token), "Token refreshed"));
    }

    @Operation(summary = "Logout and invalidate token")
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
        authService.logout(token);
        return ResponseEntity.ok(ApiResponse.ok(null, "Logged out"));
    }

    @Operation(summary = "Initiate SSO login")
    @GetMapping("/sso/init")
    public ResponseEntity<ApiResponse<String>> initiateSso() {
        return ResponseEntity.ok(ApiResponse.ok(authService.initiateSso(), "SSO URL generated"));
    }

    @Operation(summary = "Handle SSO callback")
    @PostMapping("/sso/callback")
    public ResponseEntity<ApiResponse<LoginResponse>> ssoCallback(@Valid @RequestBody SsoCallbackRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(authService.handleSsoCallback(request), "SSO login successful"));
    }

    @Operation(summary = "Request password reset email")
    @PostMapping("/password-reset/request")
    public ResponseEntity<ApiResponse<Void>> requestPasswordReset(@RequestParam String email) {
        authService.requestPasswordReset(email);
        return ResponseEntity.ok(ApiResponse.ok(null, "Password reset email sent"));
    }

    @Operation(summary = "Confirm password reset with token")
    @PostMapping("/password-reset/confirm")
    public ResponseEntity<ApiResponse<Void>> confirmPasswordReset(@Valid @RequestBody PasswordResetRequest request) {
        authService.confirmPasswordReset(request);
        return ResponseEntity.ok(ApiResponse.ok(null, "Password reset successful"));
    }

    @Operation(summary = "Setup TOTP for current user")
    @PostMapping("/totp/setup")
    public ResponseEntity<ApiResponse<Map<String, String>>> setupTotp(@RequestParam String userId) {
        return ResponseEntity.ok(ApiResponse.ok(authService.setupTotp(userId), "TOTP setup initiated"));
    }

    @Operation(summary = "Verify and enable TOTP")
    @PostMapping("/totp/enable")
    public ResponseEntity<ApiResponse<Void>> enableTotp(@RequestParam String userId, @RequestParam String code) {
        authService.verifyAndEnableTotp(userId, code);
        return ResponseEntity.ok(ApiResponse.ok(null, "TOTP enabled"));
    }
}
