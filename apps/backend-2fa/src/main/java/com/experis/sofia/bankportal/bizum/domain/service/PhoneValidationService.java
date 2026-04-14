package com.experis.sofia.bankportal.bizum.domain.service;
import org.springframework.stereotype.Service;
import java.util.regex.Pattern;

/** Valida E.164 y enmascara telefono — RN-F022-01/09 */
@Service
public class PhoneValidationService {
    private static final Pattern E164 = Pattern.compile("^\\+[1-9]\\d{6,14}$");

    public boolean isValid(String phone) {
        return phone != null && E164.matcher(phone).matches();
    }

    /** RN-F022-09: +34 *** 5678 */
    public static String mask(String phone) {
        if (phone == null || phone.length() < 4) return "***";
        return phone.substring(0, 3) + " *** " + phone.substring(phone.length() - 4);
    }
}
