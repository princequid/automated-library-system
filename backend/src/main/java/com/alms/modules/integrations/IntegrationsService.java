package com.alms.modules.integrations;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class IntegrationsService {

    public Map<String, Object> syncSis() {
        throw new UnsupportedOperationException("Not yet implemented");
    }

    public Map<String, Object> scanRfid(String rfidTag) {
        throw new UnsupportedOperationException("Not yet implemented");
    }
}
