package user

import (
	"JobScoop/internal/db"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"

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
	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	if user.Email == "" || user.Password == "" || user.Name == "" {
		http.Error(w, "Missing fields", http.StatusBadRequest)
		return
	}

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

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Password hashing failed", http.StatusInternalServerError)
		return
	}

	_, err = db.DB.Exec("INSERT INTO users (name, email, password) VALUES ($1, $2, $3)", user.Name, user.Email, string(hashedPassword))
	if err != nil {
		http.Error(w, "Error inserting user", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	w.Write([]byte("User created successfully"))
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
	expirationTime := time.Now().Add(24 * time.Hour) // Set expiration time for 24 hours
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
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Login successful",
		"token":   signedToken,
	})
}