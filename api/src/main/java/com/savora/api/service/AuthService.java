package com.savora.api.service;

import com.savora.api.dto.AuthResponse;
import com.savora.api.dto.LoginRequest;
import com.savora.api.dto.RegisterRequest;
import com.savora.api.dto.UserDto;
import com.savora.api.model.User;
import com.savora.api.repository.UserRepository;
import com.savora.api.security.JwtTokenProvider;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserService userService;

    public AuthService(
            AuthenticationManager authenticationManager,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider jwtTokenProvider,
            UserService userService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.userService = userService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest registerRequest) {
        // Check if username is already taken
        if (userRepository.existsByUsername(registerRequest.getUsername())) {
            return new AuthResponse(false, "Username is already taken!", null, null);
        }

        // Check if email is already in use
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            return new AuthResponse(false, "Email is already in use!", null, null);
        }

        // Create new user's account
        User user = new User();
        user.setUsername(registerRequest.getUsername());
        user.setEmail(registerRequest.getEmail());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        
        // Add first name and last name
        user.setFirstName(registerRequest.getFirstName());
        user.setLastName(registerRequest.getLastName());
        
        user.setCreatedAt(LocalDateTime.now());
        
        // Save the user in the database
        userRepository.save(user);
        
        // Generate JWT token for the registered user
        String jwt = jwtTokenProvider.generateToken(user.getEmail());
        
        // Convert User to UserDto
        UserDto userDto = userService.mapToUserDto(user);
        
        return new AuthResponse(true, "User registered successfully!", jwt, userDto);
    }

    public AuthResponse login(LoginRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getEmail(),
                            loginRequest.getPassword()
                    )
            );
            
            // Get the authenticated user email
            String userEmail = loginRequest.getEmail();
            
            // Generate JWT token
            String jwt = jwtTokenProvider.generateToken(userEmail);
            
            // Record login time
            userService.recordLogin(userEmail);
            
            // Get user info
            UserDto userDto = userService.getUserByEmail(userEmail);
            
            return new AuthResponse(true, "User logged in successfully!", jwt, userDto);
        } catch (Exception e) {
            return new AuthResponse(false, "Authentication failed: " + e.getMessage(), null, null);
        }
    }
}