package models

import (
	"JobScoop/internal/db"
	"log"
)

// CreateResetTokensTable creates the reset_tokens table if it does not exist
func CreateSubscriptionTable() {
	query := `
	CREATE TABLE IF NOT EXISTS subscription (
		id SERIAL PRIMARY KEY,
		User_Id INT NOT NULL,
	    Company_Id INT NOT NULL,
	    Careersite_Id INT[] NOT NULL,
	    Role_Id INT[] NOT NULL,
	    Disabled BOOLEAN NOT NULL DEFAULT FALSE,
	    Interest_Time TIMESTAMP,

		CONSTRAINT fk_user FOREIGN KEY (User_Id) REFERENCES Users(Id) ON DELETE CASCADE,
	    CONSTRAINT fk_company FOREIGN KEY (Company_Id) REFERENCES Company(Company_ID) ON DELETE CASCADE
	);
	`

	_, err := db.DB.Exec(query)
	if err != nil {
		log.Fatalf("Error creating company table: %v", err)
	}
}