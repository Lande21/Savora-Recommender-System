package com.savora.api.controller;

import com.savora.api.dto.PasswordResetRequest;
import com.savora.api.dto.UserDto;
import com.savora.api.dto.UserProfileUpdateRequest;
import com.savora.api.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.security.Principal;

@RestController
@RequestMapping("/api/users")
public class UserController {
    
    private final UserService userService;
    
    public UserController(UserService userService) {
        this.userService = userService;
    }
    
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserDto> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        UserDto user = userService.getUserByEmail(email);
        return ResponseEntity.ok(user);
    }
    
    @PutMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserDto> updateProfile(
            @Valid @RequestBody UserProfileUpdateRequest request,
            Principal principal) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        UserDto updatedUser = userService.updateUserProfile(email, request);
        return ResponseEntity.ok(updatedUser);
    }
    
    @PostMapping("/password-reset/request")
    public ResponseEntity<?> requestPasswordReset(@RequestParam String email) {
        userService.initiatePasswordReset(email);
        return ResponseEntity.ok().body(
            java.util.Map.of("message", "If the email exists, a password reset link has been sent")
        );
    }
    
    @PostMapping("/password-reset/confirm")
    public ResponseEntity<?> confirmPasswordReset(@Valid @RequestBody PasswordResetRequest request) {
        userService.completePasswordReset(request);
        return ResponseEntity.ok().body(
            java.util.Map.of("message", "Password has been reset successfully")
        );
    }
}