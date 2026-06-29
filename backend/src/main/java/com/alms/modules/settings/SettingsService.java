package com.alms.modules.settings;

import com.alms.exception.AppException;
import com.alms.modules.settings.dto.BulkUpdateRequest;
import com.alms.shared.enums.SettingType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SettingsService {

    private static final String CACHE_PREFIX = "setting:";
    private static final Duration CACHE_TTL = Duration.ofMinutes(30);

    private final SettingRepository settingRepository;
    private final StringRedisTemplate redisTemplate;

    public String get(String key) {
        String cached = redisTemplate.opsForValue().get(CACHE_PREFIX + key);
        if (cached != null) {
            return cached;
        }
        Setting setting = settingRepository.findById(key)
                .orElseThrow(() -> new AppException("Setting not found: " + key, HttpStatus.NOT_FOUND));
        redisTemplate.opsForValue().set(CACHE_PREFIX + key, setting.getValue(), CACHE_TTL);
        return setting.getValue();
    }

    public double getNumber(String key) {
        try {
            return Double.parseDouble(get(key));
        } catch (NumberFormatException e) {
            throw new AppException("Setting '" + key + "' is not a valid number", HttpStatus.INTERNAL_SERVER_ERROR, e);
        }
    }

    public boolean getBoolean(String key) {
        return "true".equals(get(key));
    }

    public Map<String, String> getAll() {
        return settingRepository.findAll().stream()
                .collect(Collectors.toMap(Setting::getKey, Setting::getValue));
    }

    @Transactional
    public void set(String key, String value, String updatedBy) {
        Setting setting = settingRepository.findById(key)
                .orElseThrow(() -> new AppException("Setting not found: " + key, HttpStatus.NOT_FOUND));
        validateValue(setting, value);
        setting.setValue(value);
        setting.setUpdatedBy(updatedBy);
        settingRepository.save(setting);
        redisTemplate.delete(CACHE_PREFIX + key);
        log.info("Setting '{}' updated by {}", key, updatedBy);
    }

    @Transactional
    public void setMany(List<BulkUpdateRequest.Entry> updates, String updatedBy) {
        for (BulkUpdateRequest.Entry entry : updates) {
            Setting setting = settingRepository.findById(entry.key())
                    .orElseThrow(() -> new AppException("Setting not found: " + entry.key(), HttpStatus.NOT_FOUND));
            validateValue(setting, entry.value());
            setting.setValue(entry.value());
            setting.setUpdatedBy(updatedBy);
            settingRepository.save(setting);
            redisTemplate.delete(CACHE_PREFIX + entry.key());
        }
        log.info("Bulk updated {} settings by {}", updates.size(), updatedBy);
    }

    private void validateValue(Setting setting, String value) {
        if (setting.getType() == SettingType.NUMBER) {
            try {
                Double.parseDouble(value);
            } catch (NumberFormatException e) {
                throw new AppException(
                        "Invalid numeric value '" + value + "' for setting '" + setting.getKey() + "'",
                        HttpStatus.BAD_REQUEST, e);
            }
        } else if (setting.getType() == SettingType.BOOLEAN) {
            if (!"true".equals(value) && !"false".equals(value)) {
                throw new AppException(
                        "Invalid boolean value '" + value + "' for setting '" + setting.getKey() + "'. Use 'true' or 'false'.",
                        HttpStatus.BAD_REQUEST);
            }
        }
    }
}
