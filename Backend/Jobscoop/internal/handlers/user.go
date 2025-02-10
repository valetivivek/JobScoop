package user

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
			Issuer: "jobscoop",
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
			Issuer: "jobscoop", // You can customize this
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
		"userid": userID,
	})
}

func ForgotPasswordHandler(w http.ResponseWriter, r *http.Request) {
	// Struct to decode the request payload
	var request struct {
		ID int `json:"user_id"`
	}

	// Decode the request payload
	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	// Fetch user's email from the database using ID
	var email string
	err = db.DB.QueryRow("SELECT email FROM users WHERE id=$1", request.ID).Scan(&email)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	// Generate token and expiration time
	token := generateResetToken()
	expiration := time.Now().Add(15 * time.Minute) // Token expires in 15 min

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
	err = sendResetEmail(email, token)
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
	if time.Now().After(expiresAt) {
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
		fmt.Println("Error updating password:", err)
		http.Error(w, "Failed to update password", http.StatusInternalServerError)
		return
	}

	// Success response
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Password reset successfully"))
}

