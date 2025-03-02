package models

import (
	"JobScoop/internal/db"
	"log"
)

func CreateCompanyTable() {
	query := `
	CREATE TABLE IF NOT EXISTS companies (
		id SERIAL PRIMARY KEY,
		name TEXT NOT NULL UNIQUE
	);
	`

	_, err := db.DB.Exec(query)
	if err != nil {
		log.Fatalf("Error creating companies table: %v", err)
	}
}
