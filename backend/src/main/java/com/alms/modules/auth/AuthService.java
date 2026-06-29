package com.alms.modules.auth;

import com.alms.modules.auth.dto.LoginRequest;
import com.alms.modules.auth.dto.LoginResponse;
import com.alms.modules.auth.dto.PasswordResetRequest;
import com.alms.modules.auth.dto.RefreshResponse;
import com.alms.modules.auth.dto.SsoCallbackRequest;
import com.alms.modules.auth.dto.TwoFactorRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    public LoginResponse login(LoginRequest request) {
        throw new UnsupportedOperationException("Not yet implemented");
    }

    public LoginResponse verifyTotp(TwoFactorRequest request) {
        throw new UnsupportedOperationException("Not yet implemented");
    }

    public RefreshResponse refresh(String refreshToken) {
        throw new UnsupportedOperationException("Not yet implemented");
    }

    public void logout(String accessToken) {
        throw new UnsupportedOperationException("Not yet implemented");
    }

    public String initiateSso() {
        throw new UnsupportedOperationException("Not yet implemented");
    }

    public LoginResponse handleSsoCallback(SsoCallbackRequest request) {
        throw new UnsupportedOperationException("Not yet implemented");
    }

    public void requestPasswordReset(String email) {
        throw new UnsupportedOperationException("Not yet implemented");
    }

    public void confirmPasswordReset(PasswordResetRequest request) {
        throw new UnsupportedOperationException("Not yet implemented");
    }

    public Map<String, String> setupTotp(String userId) {
        throw new UnsupportedOperationException("Not yet implemented");
    }

    public void verifyAndEnableTotp(String userId, String totpCode) {
        throw new UnsupportedOperationException("Not yet implemented");
    }
}
