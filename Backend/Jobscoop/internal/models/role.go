package models

import (
	"JobScoop/internal/db"
	"log"
)

// CreateResetTokensTable creates the reset_tokens table if it does not exist
func CreateRoleTable() {
	query := `
	CREATE TABLE IF NOT EXISTS roles (
		id SERIAL PRIMARY KEY,
		name TEXT NOT NULL UNIQUE
	);
	`

	_, err := db.DB.Exec(query)
	if err != nil {
		log.Fatalf("Error creating roles table: %v", err)
	}
}
