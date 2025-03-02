package handlers

import (
	"JobScoop/internal/db"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/lib/pq"
)

// SubscriptionRequest represents the incoming JSON request
type SubscriptionRequest struct {
	Email         string `json:"email"`
	Subscriptions []struct {
		CompanyName string   `json:"companyName"`
		CareerLinks []string `json:"careerLinks"`
		RoleNames   []string `json:"roleNames"`
	} `json:"subscriptions"`
}

// SubscriptionHandler processes the subscription request
func SaveSubscriptionsHandler(w http.ResponseWriter, r *http.Request) {
	var req SubscriptionRequest

	// Decode the request body
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, `{"message": "Invalid request payload"}`, http.StatusBadRequest)
		return
	}

	// Check if email is provided
	if req.Email == "" {
		http.Error(w, `{"message": "Email is required"}`, http.StatusBadRequest)
		return
	}

	// Fetch the user ID based on email
	userID, err := getUserIDByEmail(req.Email)
	if err != nil {
		http.Error(w, `{"message": "User not found. Please sign up."}`, http.StatusNotFound)
		return
	}

	// Process each subscription entry
	for _, sub := range req.Subscriptions {
		// Get or create company and its ID
		companyID, err := getOrCreateCompanyID(sub.CompanyName)
		if err != nil {
			http.Error(w, `{"message": "Error processing company"}`, http.StatusInternalServerError)
			return
		}

		// Process new career site links
		var newCareerSiteIDs []int
		for _, link := range sub.CareerLinks {
			careerSiteID, err := getOrCreateCareerSiteID(link)
			if err != nil {
				http.Error(w, `{"message": "Error processing career site"}`, http.StatusInternalServerError)
				return
			}
			newCareerSiteIDs = append(newCareerSiteIDs, careerSiteID)
		}

		// Process new role names
		var newRoleIDs []int
		for _, roleName := range sub.RoleNames {
			roleID, err := getOrCreateRoleID(roleName)
			if err != nil {
				http.Error(w, `{"message": "Error processing role"}`, http.StatusInternalServerError)
				return
			}
			newRoleIDs = append(newRoleIDs, roleID)
		}

		// Convert newCareerSiteIDs and newRoleIDs from []int to []int64
		newCareerSiteIDs64 := make([]int64, len(newCareerSiteIDs))
		for i, id := range newCareerSiteIDs {
			newCareerSiteIDs64[i] = int64(id)
		}
		newRoleIDs64 := make([]int64, len(newRoleIDs))
		for i, id := range newRoleIDs {
			newRoleIDs64[i] = int64(id)
		}

		// Check if a subscription already exists for this user and company
		var existingCareerSiteIDs []int64
		var existingRoleIDs []int64
		query := "SELECT career_site_ids, role_ids FROM subscriptions WHERE user_id=$1 AND company_id=$2"
		row := db.DB.QueryRow(query, userID, companyID)
		err = row.Scan(pq.Array(&existingCareerSiteIDs), pq.Array(&existingRoleIDs))
		if err != nil && err != sql.ErrNoRows {
			http.Error(w, `{"message": "Database error while checking existing subscription"}`, http.StatusInternalServerError)
			return
		}

		// If no existing record is found, insert a new record
		if err == sql.ErrNoRows {
			_, err = db.DB.Exec(`
				INSERT INTO subscriptions (user_id, company_id, career_site_ids, role_ids, interest_time) 
				VALUES ($1, $2, $3, $4, $5)`,
				userID, companyID, pq.Array(newCareerSiteIDs64), pq.Array(newRoleIDs64), time.Now().UTC())
			if err != nil {
				http.Error(w, `{"message": "Error inserting subscription"}`, http.StatusInternalServerError)
				return
			}
		} else {
			// Merge new career site IDs with the existing ones using a hash set
			careerSiteSet := make(map[int64]struct{})
			for _, id := range existingCareerSiteIDs {
				careerSiteSet[id] = struct{}{}
			}
			for _, id := range newCareerSiteIDs64 {
				careerSiteSet[id] = struct{}{}
			}

			// Merge new role IDs with the existing ones using a hash set
			roleSet := make(map[int64]struct{})
			for _, id := range existingRoleIDs {
				roleSet[id] = struct{}{}
			}
			for _, id := range newRoleIDs64 {
				roleSet[id] = struct{}{}
			}

			// Convert sets back to slices
			mergedCareerSiteIDs := make([]int64, 0, len(careerSiteSet))
			for id := range careerSiteSet {
				mergedCareerSiteIDs = append(mergedCareerSiteIDs, id)
			}
			mergedRoleIDs := make([]int64, 0, len(roleSet))
			for id := range roleSet {
				mergedRoleIDs = append(mergedRoleIDs, id)
			}

			// Update the existing subscription record with the merged arrays and a new interest_time
			_, err = db.DB.Exec(`
				UPDATE subscriptions 
				SET career_site_ids=$1, role_ids=$2, interest_time=$3
				WHERE user_id=$4 AND company_id=$5`,
				pq.Array(mergedCareerSiteIDs), pq.Array(mergedRoleIDs), time.Now().UTC(), userID, companyID)
			if err != nil {
				http.Error(w, `{"message": "Error updating subscription"}`, http.StatusInternalServerError)
				return
			}
		}
	}

	// Respond with success message
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Subscription processed successfully",
		"status":  "success",
	})
}

// getUserIDByEmail fetches user ID based on email
func getUserIDByEmail(email string) (int, error) {
	var userID int
	err := db.DB.QueryRow("SELECT id FROM users WHERE email = $1", email).Scan(&userID)
	if err == sql.ErrNoRows {
		return 0, fmt.Errorf("user not found")
	} else if err != nil {
		return 0, err
	}
	return userID, nil
}

// getOrCreateCompanyID fetches or inserts a company
func getOrCreateCompanyID(companyName string) (int, error) {
	var companyID int
	err := db.DB.QueryRow("SELECT id FROM companies WHERE name = $1", companyName).Scan(&companyID)
	if err == sql.ErrNoRows {
		err = db.DB.QueryRow("INSERT INTO companies (name) VALUES ($1) RETURNING id", companyName).Scan(&companyID)
		if err != nil {
			return 0, err
		}
	} else if err != nil {
		return 0, err
	}
	return companyID, nil
}

// getOrCreateCareerSiteID fetches or inserts a career site
func getOrCreateCareerSiteID(url string) (int, error) {
	var careerSiteID int
	err := db.DB.QueryRow("SELECT id FROM career_sites WHERE link = $1", url).Scan(&careerSiteID)
	if err == sql.ErrNoRows {
		err = db.DB.QueryRow("INSERT INTO career_sites (link) VALUES ($1) RETURNING id", url).Scan(&careerSiteID)
		if err != nil {
			return 0, err
		}
	} else if err != nil {
		return 0, err
	}
	return careerSiteID, nil
}

// getOrCreateRoleID fetches or inserts a role
func getOrCreateRoleID(roleName string) (int, error) {
	var roleID int
	err := db.DB.QueryRow("SELECT id FROM roles WHERE name = $1", roleName).Scan(&roleID)
	if err == sql.ErrNoRows {
		err = db.DB.QueryRow("INSERT INTO roles (name) VALUES ($1) RETURNING id", roleName).Scan(&roleID)
		if err != nil {
			return 0, err
		}
	} else if err != nil {
		return 0, err
	}
	return roleID, nil
}
