package handlers

import (
	"JobScoop/internal/db"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"math/big"
	"net/http"

	"crypto/rand"
	"net/smtp"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v4"
	"golang.org/x/crypto/bcrypt"
)

type User struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type Claims struct {
	UserID int `json:"user_id"`
	jwt.RegisteredClaims
}

func SetDB(database *sql.DB) {
	db.DB = database
}

func GetDB() *sql.DB {
	return db.DB
}

func SignupHandler(w http.ResponseWriter, r *http.Request) {
	var user User

	// Decode the request payload
	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	// Validate input fields
	if user.Email == "" || user.Password == "" || user.Name == "" {
		http.Error(w, "Missing fields", http.StatusBadRequest)
		return
	}

	// Check if the user already exists
	var exists bool
	err = db.DB.QueryRow("SELECT EXISTS (SELECT 1 FROM users WHERE email=$1)", user.Email).Scan(&exists)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	if exists {
		http.Error(w, "User already exists", http.StatusConflict)
		return
	}

	// Hash the password before storing it
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Password hashing failed", http.StatusInternalServerError)
		return
	}

	// Insert the new user into the database
	_, err = db.DB.Exec("INSERT INTO users (name, email, password) VALUES ($1, $2, $3)", user.Name, user.Email, string(hashedPassword))
	if err != nil {
		http.Error(w, "Error inserting user", http.StatusInternalServerError)
		return
	}

	// Fetch the newly created user ID for JWT claims
	var userID int
	err = db.DB.QueryRow("SELECT id FROM users WHERE email = $1", user.Email).Scan(&userID)
	if err != nil {
		http.Error(w, "Error fetching user ID", http.StatusInternalServerError)
		return
	}

	// Generate JWT token
	expirationTime := time.Now().Add(1 * time.Hour) // Token expires in 1 hour
	claims := &Claims{
		UserID: int(userID), // Store user ID in token claims
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			Issuer:    "jobscoop",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signedToken, err := token.SignedString([]byte(os.Getenv("JWT_TOKEN")))
	if err != nil {
		fmt.Println(err)
		http.Error(w, "Error signing the token", http.StatusInternalServerError)
		return
	}

	// Send the JWT token as the response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "User created successfully",
		"token":   signedToken,
		"userid":  userID,
	})
}

// LoginHandler for authenticating user and issuing JWT token
func LoginHandler(w http.ResponseWriter, r *http.Request) {
	var loginRequest struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	// Decode the request payload
	err := json.NewDecoder(r.Body).Decode(&loginRequest)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	// Check if email and password are provided
	if loginRequest.Email == "" || loginRequest.Password == "" {
		http.Error(w, "Email and password are required", http.StatusBadRequest)
		return
	}

	// Check if the user exists
	var storedHashedPassword string
	var userID int
	err = db.DB.QueryRow("SELECT id, password FROM users WHERE email=$1", loginRequest.Email).Scan(&userID, &storedHashedPassword)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "User does not exist. Please sign up.", http.StatusNotFound)
		} else {
			fmt.Println(err)
			http.Error(w, "Database error", http.StatusInternalServerError)
		}
		return
	}

	// Compare the hashed input password with the stored hashed password
	err = bcrypt.CompareHashAndPassword([]byte(storedHashedPassword), []byte(loginRequest.Password))
	if err != nil {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	// Successfully authenticated, create the JWT token
	expirationTime := time.Now().Add(1 * time.Hour) // Set expiration time for 24 hours
	claims := &Claims{
		UserID: userID, // Store the user ID in the token claims
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			Issuer:    "jobscoop", // You can customize this
		},
	}

	// Create a new JWT token with claims
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Sign the token with the secret key
	signedToken, err := token.SignedString([]byte(os.Getenv("JWT_TOKEN")))
	if err != nil {
		fmt.Println(err)
		http.Error(w, "Error signing the token", http.StatusInternalServerError)
		return
	}

	// Send the JWT token as the response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Login successful",
		"token":   signedToken,
		"userid":  userID,
	})
}

var sendResetEmailFunc = sendResetEmail // Assign function to a variable for mocking

func ForgotPasswordHandler(w http.ResponseWriter, r *http.Request) {
	// Struct to decode the request payload
	var request struct {
		Email string `json:"email"`
	}

	// Decode the request payload
	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	email := request.Email

	// Check if the email exists in the users table
	var exists bool
	err = db.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE email=$1)", email).Scan(&exists)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	// If the email doesn't exist, inform the user to sign up first
	if !exists {
		http.Error(w, "User does not exist, can't reset password. Please sign up first.", http.StatusNotFound)
		return
	}

	// Generate token and expiration time
	token := generateResetToken()
	expiration := time.Now().UTC().Add(15 * time.Minute) // Token expires in 15 min

	// Store token in database (Insert or Update)
	_, err = db.DB.Exec(
		`INSERT INTO reset_tokens (email, token, expires_at) 
		 VALUES ($1, $2, $3) 
		 ON CONFLICT(email) 
		 DO UPDATE SET token=$2, expires_at=$3`,
		email, token, expiration,
	)
	if err != nil {
		fmt.Println(err)
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	// Send reset email
	err = sendResetEmailFunc(email, token)
	if err != nil {
		http.Error(w, "Failed to send email", http.StatusInternalServerError)
		return
	}

	// Success response
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Password reset email sent successfully!"))
}

func generateResetToken() string {
	min := int64(100000)
	max := int64(999999)
	rangeVal := max - min + 1

	// Securely generate a random number in the given range
	num, err := rand.Int(rand.Reader, big.NewInt(rangeVal))
	if err != nil {
		panic(err) // Handle error appropriately
	}

	// Add the minimum value to ensure the token is always 6 digits
	token := num.Int64() + min
	return fmt.Sprintf("%d", token)
}

func sendResetEmail(email, token string) error {
	SMTP_HOST := os.Getenv("SMTP_HOST")
	SMTP_PORT := os.Getenv("SMTP_PORT")
	SMTP_USER := os.Getenv("SMTP_USER")
	SMTP_PASS := os.Getenv("SMTP_PASS")
	auth := smtp.PlainAuth("", SMTP_USER, SMTP_PASS, SMTP_HOST)

	subject := "Subject: Password Reset Request\n"
	body := "Copy this code to reset your password: " + token + "\n"
	message := []byte(subject + "\n" + body)

	err := smtp.SendMail(SMTP_HOST+":"+SMTP_PORT, auth, SMTP_USER, []string{email}, message)
	if err != nil {
		log.Printf("Failed to send email: %v", err)
		return err
	}

	log.Println("Password reset email sent successfully!")
	return nil
}

func VerifyCodeHandler(w http.ResponseWriter, r *http.Request) {
	// Struct to decode the request payload
	var request struct {
		Email string `json:"email"`
		Token string `json:"token"`
	}

	// Decode the request payload
	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	if request.Email == "" || request.Token == "" {
		http.Error(w, "Email and token are required", http.StatusBadRequest)
		return
	}

	// Fetch stored token for the email from the database
	var storedToken string
	var expiresAt time.Time

	err = db.DB.QueryRow(
		"SELECT token, expires_at FROM reset_tokens WHERE email=$1",
		request.Email,
	).Scan(&storedToken, &expiresAt)

	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "No reset request found for this email", http.StatusNotFound)
			return
		}
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	// Check if the token has expired
	if time.Now().UTC().After(expiresAt) {
		http.Error(w, "Token has expired", http.StatusUnauthorized)
		return
	}

	// Check if the token matches
	if storedToken != request.Token {
		http.Error(w, "Invalid verification code", http.StatusUnauthorized)
		return
	}

	// Success response
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Verification successful"))
}

func ResetPasswordHandler(w http.ResponseWriter, r *http.Request) {
	// Struct to decode the request payload
	var request struct {
		Email       string `json:"email"`
		NewPassword string `json:"new_password"`
	}

	// Decode the request payload
	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	if request.Email == "" || request.NewPassword == "" {
		http.Error(w, "Email and new password are required", http.StatusBadRequest)
		return
	}

	// Check if the user exists
	var existingEmail string
	err = db.DB.QueryRow(
		"SELECT email FROM users WHERE email=$1",
		request.Email,
	).Scan(&existingEmail)

	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	// Hash the new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(request.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Failed to hash password", http.StatusInternalServerError)
		return
	}

	// Update the user's password in the database
	_, err = db.DB.Exec(
		"UPDATE users SET password=$1 WHERE email=$2",
		hashedPassword, request.Email,
	)
	if err != nil {
		http.Error(w, "Failed to update password", http.StatusInternalServerError)
		return
	}

	// Success response
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Password reset successfully"))
}

type GetUserRequest struct {
	Email string `json:"email"`
}

// GetUserResponse represents the response structure
type GetUserResponse struct {
	Name      string `json:"name"`
	Email     string `json:"email"`
	CreatedAt string `json:"created_at"`
}

func GetUser(w http.ResponseWriter, r *http.Request) {
	// Parse the request body
	var req GetUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"message": "Invalid request payload"}`, http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	// Validate required fields
	if req.Email == "" {
		http.Error(w, `{"message": "Email is required"}`, http.StatusBadRequest)
		return
	}

	// Query the database for the user
	var user GetUserResponse
	err := db.DB.QueryRow(
		`SELECT name, email, created_at FROM users WHERE email = $1`,
		req.Email,
	).Scan(&user.Name, &user.Email, &user.CreatedAt)

	if err != nil {
		// Check if no rows were returned
		if err.Error() == "sql: no rows in result set" {
			http.Error(w, `{"message": "User not found"}`, http.StatusNotFound)
		} else {
			// Log the actual error for debugging
			// log.Printf("Database error: %v", err)
			http.Error(w, `{"message": "Error retrieving user data"}`, http.StatusInternalServerError)
		}
		return
	}

	// Set response headers
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	// Return the user data
	json.NewEncoder(w).Encode(user)
}


// UpdateUserRequest represents the expected JSON payload for updating a user.
type UpdateUserRequest struct {
	Email string `json:"email"`
	Name  string `json:"name"`
}

// UpdateUser updates the name of a user identified by their email.
func UpdateUser(w http.ResponseWriter, r *http.Request) {
	// Parse the request body.
	var req UpdateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"message": "Invalid request payload"}`, http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	// Validate required fields.
	if req.Email == "" || req.Name == "" {
		http.Error(w, `{"message": "Email and Name are required"}`, http.StatusBadRequest)
		return
	}

	// Update the user's name in the database.
	_, err := db.DB.Exec(`UPDATE users SET name = $1 WHERE email = $2`, req.Name, req.Email)
	if err != nil {
		http.Error(w, `{"message": "Error updating user"}`, http.StatusInternalServerError)
		return
	}

	// Set response headers.
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	// Return a success message.
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "User updated successfully",
		"status":  "success",
	})
}