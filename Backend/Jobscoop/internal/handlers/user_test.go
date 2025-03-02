package handlers

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
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
