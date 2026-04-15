package com.experis.sofia.bankportal.bizum.api;
import com.experis.sofia.bankportal.bizum.domain.exception.*;
import com.experis.sofia.bankportal.twofa.domain.exception.InvalidOtpException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import java.util.Map;

/**
 * LA-TEST-003: ExceptionHandler scope=bizum — todos los tipos de excepcion
 * tienen handler HTTP explicito (evitar HTTP 500).
 * Incluye InvalidOtpException de paquete twofa (precedente BUG-STG-022-002).
 */
@RestControllerAdvice(basePackages = "com.experis.sofia.bankportal.bizum")
public class BizumExceptionHandler {

    @ExceptionHandler(BizumNotActiveException.class)
    public ResponseEntity<Map<String,String>> handleNotActive(BizumNotActiveException e) {
        return ResponseEntity.status(403).body(Map.of("code","BIZUM_NOT_ACTIVE","message",e.getMessage()));
    }
    @ExceptionHandler(PhoneAlreadyRegisteredException.class)
    public ResponseEntity<Map<String,String>> handlePhoneExists(PhoneAlreadyRegisteredException e) {
        return ResponseEntity.status(409).body(Map.of("code","PHONE_ALREADY_REGISTERED","message",e.getMessage()));
    }
    @ExceptionHandler(PhoneNotRegisteredException.class)
    public ResponseEntity<Map<String,String>> handlePhoneNotFound(PhoneNotRegisteredException e) {
        return ResponseEntity.status(404).body(Map.of("code","PHONE_NOT_REGISTERED","message",e.getMessage()));
    }
    @ExceptionHandler(BizumLimitExceededException.class)
    public ResponseEntity<Map<String,String>> handleLimit(BizumLimitExceededException e) {
        return ResponseEntity.status(422).body(Map.of("code","LIMIT_EXCEEDED","message",e.getMessage()));
    }
    @ExceptionHandler(BizumRequestExpiredException.class)
    public ResponseEntity<Map<String,String>> handleExpired(BizumRequestExpiredException e) {
        return ResponseEntity.status(422).body(Map.of("code","REQUEST_EXPIRED","message",e.getMessage()));
    }
    @ExceptionHandler(BizumRequestNotFoundException.class)
    public ResponseEntity<Map<String,String>> handleNotFound(BizumRequestNotFoundException e) {
        return ResponseEntity.status(404).body(Map.of("code","REQUEST_NOT_FOUND","message",e.getMessage()));
    }
    @ExceptionHandler(InvalidOtpException.class)
    public ResponseEntity<Map<String,String>> handleOtp(InvalidOtpException e) {
        return ResponseEntity.status(401).body(Map.of("code","OTP_INVALID","message",e.getMessage()));
    }
}
