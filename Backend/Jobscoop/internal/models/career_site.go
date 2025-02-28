package models

import (
	"JobScoop/internal/db"
	"log"
)

// CreateResetTokensTable creates the reset_tokens table if it does not exist
func CreateCareerSiteTable() {
	query := `
	CREATE TABLE IF NOT EXISTS career_site (
		id SERIAL PRIMARY KEY,
		career_site TEXT NOT NULL UNIQUE
	);
	`

	_, err := db.DB.Exec(query)
	if err != nil {
		log.Fatalf("Error creating company table: %v", err)
	}
}
