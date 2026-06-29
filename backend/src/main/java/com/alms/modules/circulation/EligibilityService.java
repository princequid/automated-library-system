package com.alms.modules.circulation;

import com.alms.modules.users.dto.EligibilityResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EligibilityService {

    public EligibilityResult check(String userId) {
        throw new UnsupportedOperationException("Not yet implemented");
    }
}
