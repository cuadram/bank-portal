package com.experis.sofia.bankportal.profile.application;

import com.experis.sofia.bankportal.profile.application.dto.*;
import com.experis.sofia.bankportal.profile.domain.*;
import com.experis.sofia.bankportal.auth.domain.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GetProfileUseCase {

    private final UserProfileRepository     profileRepo;
    private final UserAccountRepository     userRepo;

    @Transactional(readOnly = true)
    public ProfileResponse execute(UUID userId) {
        var user    = userRepo.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado: " + userId));
        var profile = profileRepo.findByUserId(userId).orElse(null);

        AddressDto address = profile != null
                ? new AddressDto(profile.getStreet(), profile.getCity(),
                                 profile.getPostalCode(), profile.getCountry())
                : null;

        return new ProfileResponse(
                userId,
                user.getEmail(),   // fullName — usa email como placeholder hasta tener nombre real
                user.getEmail(),
                profile != null ? profile.getPhone() : null,
                address,
                false,             // twoFactorEnabled — simplificado para MVP
                user.getCreatedAt() != null ? user.getCreatedAt().atZone(java.time.ZoneOffset.UTC).toLocalDateTime() : null
        );
    }
}
