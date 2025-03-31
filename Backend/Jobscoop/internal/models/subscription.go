package models

import (
	"JobScoop/internal/db"
	"log"
)

// CreateResetTokensTable creates the reset_tokens table if it does not exist
func CreateSubscriptionTable() {
	query := `
	CREATE TABLE IF NOT EXISTS subscriptions (
		id SERIAL PRIMARY KEY,
		User_Id INT NOT NULL,
	    Company_Id INT NOT NULL,
	    Career_site_Ids INT[] NOT NULL,
	    Role_Ids INT[] NOT NULL,
	    Active BOOLEAN NOT NULL DEFAULT TRUE,
	    Interest_Time TIMESTAMP,

		CONSTRAINT fk_user FOREIGN KEY (User_Id) REFERENCES Users(Id) ON DELETE CASCADE,
	    CONSTRAINT fk_company FOREIGN KEY (Company_Id) REFERENCES Companies(Id) ON DELETE CASCADE,
		CONSTRAINT unique_user_company UNIQUE (User_Id, Company_Id)
	);
	`

	_, err := db.DB.Exec(query)
	if err != nil {
		log.Fatalf("Error creating subscriptions table: %v", err)
	}
}