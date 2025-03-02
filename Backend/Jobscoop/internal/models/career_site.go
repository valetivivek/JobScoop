package models

import (
	"JobScoop/internal/db"
	"log"
)

// CreateResetTokensTable creates the reset_tokens table if it does not exist
func CreateCareerSiteTable() {
	query := `
	CREATE TABLE IF NOT EXISTS career_sites (
		id SERIAL PRIMARY KEY,
		company_id INT NOT NULL,
		link TEXT NOT NULL UNIQUE
	);
	`

	_, err := db.DB.Exec(query)
	if err != nil {
		log.Fatalf("Error creating career sites table: %v", err)
	}
}
