package com.alms.modules.users;

import com.alms.modules.users.dto.CreateUserRequest;
import com.alms.modules.users.dto.EligibilityResult;
import com.alms.modules.users.dto.UpdateStatusRequest;
import com.alms.modules.users.dto.UpdateUserRequest;
import com.alms.modules.users.dto.UserDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Slf4j
public class UsersService {

    public Page<UserDto> findAll(String search, String role, String status, Pageable pageable) {
        throw new UnsupportedOperationException("Not yet implemented");
    }

    public UserDto findById(String id) {
        throw new UnsupportedOperationException("Not yet implemented");
    }

    public UserDto create(CreateUserRequest request) {
        throw new UnsupportedOperationException("Not yet implemented");
    }

    public UserDto update(String id, UpdateUserRequest request) {
        throw new UnsupportedOperationException("Not yet implemented");
    }

    public void delete(String id) {
        throw new UnsupportedOperationException("Not yet implemented");
    }

    public UserDto updateStatus(String id, UpdateStatusRequest request) {
        throw new UnsupportedOperationException("Not yet implemented");
    }

    public EligibilityResult checkEligibility(String id) {
        throw new UnsupportedOperationException("Not yet implemented");
    }

    public Object bulkImport(MultipartFile file) {
        throw new UnsupportedOperationException("Not yet implemented");
    }
}
