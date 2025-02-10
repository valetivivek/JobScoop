package models

import (
	"JobScoop/internal/db"
	"log"
)

// CreateResetTokensTable creates the reset_tokens table if it does not exist
func CreateResetTokensTable() {
	query := `
	CREATE TABLE IF NOT EXISTS reset_tokens (
		id SERIAL PRIMARY KEY,
		email TEXT NOT NULL UNIQUE,
		token TEXT NOT NULL UNIQUE,
		expires_at TIMESTAMP NOT NULL
	);
	`

	_, err := db.DB.Exec(query)
	if err != nil {
		log.Fatalf("Error creating reset_tokens table: %v", err)
	}
}
