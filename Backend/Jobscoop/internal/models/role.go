package models

import (
	"JobScoop/internal/db"
	"log"
)

// CreateResetTokensTable creates the reset_tokens table if it does not exist
func CreateRoleTable() {
	query := `
	CREATE TABLE IF NOT EXISTS role (
		id SERIAL PRIMARY KEY,
		role TEXT NOT NULL UNIQUE
	);
	`

	_, err := db.DB.Exec(query)
	if err != nil {
		log.Fatalf("Error creating company table: %v", err)
	}
}
