package handlers

import (
	"JobScoop/internal/db"
	"bytes"
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"golang.org/x/crypto/bcrypt"
)

func init() {
	os.Setenv("JWT_TOKEN", "test_secret")
}

var originalDb *sql.DB

func TestSignupHandler(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("Error initializing mock database: %v", err)
	}
	defer db.Close()

	originalDb = GetDB()
	SetDB(db)
	defer SetDB(originalDb)
	tests := []struct {
		name         string
		requestBody  map[string]string
		mockSetup    func()
		expectedCode int
		expectedMsg  string
	}{
		{
			name: "Successful Signup",
			requestBody: map[string]string{
				"name":     "John Doe",
				"email":    "john@example.com",
				"password": "securepassword",
			},
			mockSetup: func() {
				// User does not exist check
				mock.ExpectQuery("SELECT EXISTS \\(SELECT 1 FROM users WHERE email=\\$1\\)").
					WithArgs("john@example.com").
					WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(false))

				// Insert new user
				mock.ExpectExec("INSERT INTO users").
					WithArgs("John Doe", "john@example.com", sqlmock.AnyArg()).
					WillReturnResult(sqlmock.NewResult(1, 1))

				// Fetch newly created user ID
				mock.ExpectQuery("SELECT id FROM users WHERE email = \\$1").
					WithArgs("john@example.com").
					WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(1))
			},
			expectedCode: http.StatusCreated,
			expectedMsg:  "User created successfully",
		},
		{
			name: "User Already Exists",
			requestBody: map[string]string{
				"name":     "John Doe",
				"email":    "john@example.com",
				"password": "securepassword",
			},
			mockSetup: func() {
				mock.ExpectQuery("SELECT EXISTS \\(SELECT 1 FROM users WHERE email=\\$1\\)").
					WithArgs("john@example.com").
					WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(true))
			},
			expectedCode: http.StatusConflict,
			expectedMsg:  "User already exists",
		},
		{
			name: "Missing Fields",
			requestBody: map[string]string{
				"name": "John Doe",
			},
			mockSetup:    func() {},
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Missing fields",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Setup mock expectations
			tt.mockSetup()

			// Convert requestBody to JSON
			reqBody, _ := json.Marshal(tt.requestBody)

			// Create HTTP request
			req, err := http.NewRequest("POST", "/signup", bytes.NewBuffer(reqBody))
			if err != nil {
				t.Fatalf("Could not create request: %v", err)
			}
			req.Header.Set("Content-Type", "application/json")

			// Create a response recorder
			rr := httptest.NewRecorder()

			// Call the handler
			handler := http.HandlerFunc(SignupHandler)
			handler.ServeHTTP(rr, req)

			// Check status code
			if rr.Code != tt.expectedCode {
				t.Errorf("Expected status %d, got %d", tt.expectedCode, rr.Code)
			}

			// Parse response body
			var response map[string]interface{}
			json.Unmarshal(rr.Body.Bytes(), &response)

			// Check response message
			if message, exists := response["message"]; exists {
				if message != tt.expectedMsg {
					t.Errorf("Expected message '%s', got '%s'", tt.expectedMsg, message)
				}
			}
		})
	}

}

func TestLoginHandler(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("Error initializing mock database: %v", err)
	}
	defer db.Close()

	originalDb := GetDB()
	SetDB(db)
	defer SetDB(originalDb)

	// Hash a sample password for comparison
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("securepassword"), bcrypt.DefaultCost)

	tests := []struct {
		name         string
		requestBody  map[string]string
		mockSetup    func()
		expectedCode int
		expectedMsg  string
	}{
		{
			name: "Successful Login",
			requestBody: map[string]string{
				"email":    "john@example.com",
				"password": "securepassword",
			},
			mockSetup: func() {
				mock.ExpectQuery("SELECT id, password FROM users WHERE email=\\$1").
					WithArgs("john@example.com").
					WillReturnRows(sqlmock.NewRows([]string{"id", "password"}).AddRow(1, string(hashedPassword)))
			},
			expectedCode: http.StatusOK,
			expectedMsg:  "Login successful",
		},
		{
			name: "User Does Not Exist",
			requestBody: map[string]string{
				"email":    "nonexistent@example.com",
				"password": "somepassword",
			},
			mockSetup: func() {
				mock.ExpectQuery("SELECT id, password FROM users WHERE email=\\$1").
					WithArgs("nonexistent@example.com").
					WillReturnError(sql.ErrNoRows)
			},
			expectedCode: http.StatusNotFound,
			expectedMsg:  "User does not exist. Please sign up.",
		},
		{
			name: "Invalid Password",
			requestBody: map[string]string{
				"email":    "john@example.com",
				"password": "wrongpassword",
			},
			mockSetup: func() {
				mock.ExpectQuery("SELECT id, password FROM users WHERE email=\\$1").
					WithArgs("john@example.com").
					WillReturnRows(sqlmock.NewRows([]string{"id", "password"}).AddRow(1, string(hashedPassword)))
			},
			expectedCode: http.StatusUnauthorized,
			expectedMsg:  "Invalid credentials",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Setup mock expectations
			tt.mockSetup()

			// Convert requestBody to JSON
			reqBody, _ := json.Marshal(tt.requestBody)

			// Create HTTP request
			req, err := http.NewRequest("POST", "/login", bytes.NewBuffer(reqBody))
			if err != nil {
				t.Fatalf("Could not create request: %v", err)
			}
			req.Header.Set("Content-Type", "application/json")

			// Create a response recorder
			rr := httptest.NewRecorder()

			// Call the handler
			handler := http.HandlerFunc(LoginHandler)
			handler.ServeHTTP(rr, req)

			// Check status code
			if rr.Code != tt.expectedCode {
				t.Errorf("Expected status %d, got %d", tt.expectedCode, rr.Code)
			}

			// Parse response body
			var response map[string]interface{}
			json.Unmarshal(rr.Body.Bytes(), &response)

			// Check response message
			if message, exists := response["message"]; exists {
				if message != tt.expectedMsg {
					t.Errorf("Expected message '%s', got '%s'", tt.expectedMsg, message)
				}
			}
		})
	}
}

func TestForgotPasswordHandler(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("Error initializing mock database: %v", err)
	}
	defer db.Close()

	originalDb := GetDB()
	SetDB(db)
	defer SetDB(originalDb)

	sendResetEmailFunc = func(email, token string) error {
		return nil // Pretend email is sent successfully
	}

	tests := []struct {
		name         string
		requestBody  map[string]string
		mockSetup    func()
		expectedCode int
		expectedMsg  string
	}{
		{
			name: "Successful Password Reset Request",
			requestBody: map[string]string{
				"email": "john@example.com",
			},
			mockSetup: func() {
				// User exists check
				mock.ExpectQuery(`SELECT EXISTS\(SELECT 1 FROM users WHERE email=\$1\)`).
					WithArgs("john@example.com").
					WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(true))

				// Insert or update reset token
				mock.ExpectExec(`INSERT INTO reset_tokens \(email, token, expires_at\) .* ON CONFLICT\(email\) DO UPDATE`).
					WithArgs("john@example.com", sqlmock.AnyArg(), sqlmock.AnyArg()).
					WillReturnResult(sqlmock.NewResult(1, 1))
			},
			expectedCode: http.StatusOK,
			expectedMsg:  "Password reset email sent successfully!",
		},
		{
			name: "User Does Not Exist",
			requestBody: map[string]string{
				"email": "unknown@example.com",
			},
			mockSetup: func() {
				mock.ExpectQuery(`SELECT EXISTS\(SELECT 1 FROM users WHERE email=\$1\)`).
					WithArgs("unknown@example.com").
					WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(false))
			},
			expectedCode: http.StatusNotFound,
			expectedMsg:  "User does not exist, can't reset password. Please sign up first.",
		},
		{
			name:         "Invalid Request Payload",
			requestBody:  map[string]string{},
			mockSetup:    func() {},
			expectedCode: http.StatusInternalServerError,
			expectedMsg:  "Invalid request payload",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Setup mock expectations
			tt.mockSetup()

			// Convert requestBody to JSON
			reqBody, _ := json.Marshal(tt.requestBody)

			// Create HTTP request
			req, err := http.NewRequest("POST", "/forgot-password", bytes.NewBuffer(reqBody))
			if err != nil {
				t.Fatalf("Could not create request: %v", err)
			}
			req.Header.Set("Content-Type", "application/json")

			// Create a response recorder
			rr := httptest.NewRecorder()

			// Call the handler
			handler := http.HandlerFunc(ForgotPasswordHandler)
			handler.ServeHTTP(rr, req)

			// Check status code
			if rr.Code != tt.expectedCode {
				t.Errorf("Expected status %d, got %d", tt.expectedCode, rr.Code)
			}

			// Check response message if applicable
			if rr.Code == http.StatusOK {
				if rr.Body.String() != tt.expectedMsg {
					t.Errorf("Expected message '%s', got '%s'", tt.expectedMsg, rr.Body.String())
				}
			}
		})
	}
}

func TestVerifyCodeHandler(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("Error initializing mock database: %v", err)
	}
	defer db.Close()

	originalDb := GetDB()
	SetDB(db)
	defer SetDB(originalDb)

	tests := []struct {
		name         string
		requestBody  map[string]string
		mockSetup    func()
		expectedCode int
		expectedMsg  string
	}{
		{
			name: "Successful Verification",
			requestBody: map[string]string{
				"email": "john@example.com",
				"token": "valid_token",
			},
			mockSetup: func() {
				mock.ExpectQuery("SELECT token, expires_at FROM reset_tokens WHERE email=\\$1").
					WithArgs("john@example.com").
					WillReturnRows(sqlmock.NewRows([]string{"token", "expires_at"}).
						AddRow("valid_token", time.Now().UTC().Add(10*time.Minute)))
			},
			expectedCode: http.StatusOK,
			expectedMsg:  "Verification successful",
		},
		{
			name:         "Invalid Request Payload",
			requestBody:  map[string]string{},
			mockSetup:    func() {},
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Email and token are required",
		},
		{
			name: "No Reset Request Found",
			requestBody: map[string]string{
				"email": "nonexistent@example.com",
				"token": "some_token",
			},
			mockSetup: func() {
				mock.ExpectQuery("SELECT token, expires_at FROM reset_tokens WHERE email=\\$1").
					WithArgs("nonexistent@example.com").
					WillReturnError(sql.ErrNoRows)
			},
			expectedCode: http.StatusNotFound,
			expectedMsg:  "No reset request found for this email",
		},
		{
			name: "Expired Token",
			requestBody: map[string]string{
				"email": "john@example.com",
				"token": "expired_token",
			},
			mockSetup: func() {
				mock.ExpectQuery("SELECT token, expires_at FROM reset_tokens WHERE email=\\$1").
					WithArgs("john@example.com").
					WillReturnRows(sqlmock.NewRows([]string{"token", "expires_at"}).
						AddRow("expired_token", time.Now().UTC().Add(-10*time.Minute)))
			},
			expectedCode: http.StatusUnauthorized,
			expectedMsg:  "Token has expired",
		},
		{
			name: "Invalid Token",
			requestBody: map[string]string{
				"email": "john@example.com",
				"token": "wrong_token",
			},
			mockSetup: func() {
				mock.ExpectQuery("SELECT token, expires_at FROM reset_tokens WHERE email=\\$1").
					WithArgs("john@example.com").
					WillReturnRows(sqlmock.NewRows([]string{"token", "expires_at"}).
						AddRow("valid_token", time.Now().UTC().Add(10*time.Minute)))
			},
			expectedCode: http.StatusUnauthorized,
			expectedMsg:  "Invalid verification code",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.mockSetup()
			reqBody, _ := json.Marshal(tt.requestBody)

			req, err := http.NewRequest("POST", "/verify-code", bytes.NewBuffer(reqBody))
			if err != nil {
				t.Fatalf("Could not create request: %v", err)
			}
			req.Header.Set("Content-Type", "application/json")

			rr := httptest.NewRecorder()
			handler := http.HandlerFunc(VerifyCodeHandler)
			handler.ServeHTTP(rr, req)

			if rr.Code != tt.expectedCode {
				t.Errorf("Expected status %d, got %d", tt.expectedCode, rr.Code)
			}

			var response map[string]interface{}
			json.Unmarshal(rr.Body.Bytes(), &response)

			if message, exists := response["message"]; exists {
				if message != tt.expectedMsg {
					t.Errorf("Expected message '%s', got '%s'", tt.expectedMsg, message)
				}
			}
		})
	}
}

func TestResetPasswordHandler(t *testing.T) {
	// Create a mock database
	mockDB, mock, _ := sqlmock.New()
	defer mockDB.Close()
	db.DB = mockDB // Replace actual DB with mock

	tests := []struct {
		name           string
		requestBody    map[string]string
		prepareMock    func()
		expectedStatus int
		expectedBody   string
	}{
		{
			name: "Successful Password Reset",
			requestBody: map[string]string{
				"email":        "test@example.com",
				"new_password": "newpassword123",
			},
			prepareMock: func() {
				mock.ExpectQuery("SELECT email FROM users WHERE email=\\$1").
					WithArgs("test@example.com").
					WillReturnRows(sqlmock.NewRows([]string{"email"}).AddRow("test@example.com"))

				mock.ExpectExec("UPDATE users SET password=\\$1 WHERE email=\\$2").
					WithArgs(sqlmock.AnyArg(), "test@example.com").
					WillReturnResult(sqlmock.NewResult(1, 1))
			},
			expectedStatus: http.StatusOK,
			expectedBody:   "Password reset successfully",
		},
		{
			name:           "Invalid Request Payload",
			requestBody:    map[string]string{},
			prepareMock:    func() {},
			expectedStatus: http.StatusBadRequest,
			expectedBody:   "Email and new password are required",
		},
		{
			name: "User Not Found",
			requestBody: map[string]string{
				"email":        "nonexistent@example.com",
				"new_password": "newpassword123",
			},
			prepareMock: func() {
				mock.ExpectQuery("SELECT email FROM users WHERE email=\\$1").
					WithArgs("nonexistent@example.com").
					WillReturnError(sql.ErrNoRows)
			},
			expectedStatus: http.StatusNotFound,
			expectedBody:   "User not found",
		},
		{
			name: "Database Error on User Lookup",
			requestBody: map[string]string{
				"email":        "test@example.com",
				"new_password": "newpassword123",
			},
			prepareMock: func() {
				mock.ExpectQuery("SELECT email FROM users WHERE email=\\$1").
					WithArgs("test@example.com").
					WillReturnError(errors.New("DB error"))
			},
			expectedStatus: http.StatusInternalServerError,
			expectedBody:   "Database error",
		},
		{
			name: "Failed to Update Password",
			requestBody: map[string]string{
				"email":        "test@example.com",
				"new_password": "newpassword123",
			},
			prepareMock: func() {
				mock.ExpectQuery("SELECT email FROM users WHERE email=\\$1").
					WithArgs("test@example.com").
					WillReturnRows(sqlmock.NewRows([]string{"email"}).AddRow("test@example.com"))

				mock.ExpectExec("UPDATE users SET password=\\$1 WHERE email=\\$2").
					WithArgs(sqlmock.AnyArg(), "test@example.com").
					WillReturnError(errors.New("Update failed"))
			},
			expectedStatus: http.StatusInternalServerError,
			expectedBody:   "Failed to update password",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Prepare mock responses
			tt.prepareMock()

			// Encode request body
			body, _ := json.Marshal(tt.requestBody)
			req := httptest.NewRequest("POST", "/reset-password", bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")

			// Create response recorder
			rec := httptest.NewRecorder()
			ResetPasswordHandler(rec, req)

			// Validate response
			if rec.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, rec.Code)
			}
			if tt.expectedBody != "" && strings.TrimSpace(rec.Body.String()) != tt.expectedBody {
				t.Errorf("Expected body %q, got %q", tt.expectedBody, rec.Body.String())
			}
		})
	}
}
