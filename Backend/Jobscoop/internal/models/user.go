package models

import (
	"JobScoop/internal/db"
	"log"
)

// User represents the user model.
type User struct {
	ID       int    `json:"id"`
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

// CreateUserTable creates the users table in the database if it doesn't exist.
func CreateUserTable() {
	query := `
	CREATE TABLE IF NOT EXISTS users (
		id SERIAL PRIMARY KEY,
		name VARCHAR(100) NOT NULL,
		email VARCHAR(100) NOT NULL UNIQUE,
		password VARCHAR(255) NOT NULL
	);
	`

	_, err := db.DB.Exec(query)
	if err != nil {
		log.Fatal("Failed to create users table:", err)
	}
}
