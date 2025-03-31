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

var (
	getUserIDByEmailFunc        = getUserIDByEmail
	getOrCreateCompanyIDFunc    = getOrCreateCompanyID
	getOrCreateCareerSiteIDFunc = getOrCreateCareerSiteID
	getOrCreateRoleIDFunc       = getOrCreateRoleID
	getCompanyNameByIDFunc      = getCompanyNameByID
	getCareerSiteLinkByIDFunc   = getCareerSiteLinkByID
	getRoleNameByIDFunc         = getRoleNameByID
	getCompanyIDIfExistsFunc    = getCompanyIDIfExists
)

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
	userID, err := getUserIDByEmailFunc(req.Email)
	if err != nil {
		http.Error(w, `{"message": "User not found. Please sign up."}`, http.StatusNotFound)
		return
	}

	// Process each subscription entry
	for _, sub := range req.Subscriptions {
		// Get or create company and its ID
		companyID, err := getOrCreateCompanyIDFunc(sub.CompanyName)
		if err != nil {
			http.Error(w, `{"message": "Error processing company"}`, http.StatusInternalServerError)
			return
		}

		// Process new career site links
		var newCareerSiteIDs []int
		for _, link := range sub.CareerLinks {
			careerSiteID, err := getOrCreateCareerSiteIDFunc(link, companyID)
			if err != nil {
				http.Error(w, `{"message": "Error processing career site"}`, http.StatusInternalServerError)
				return
			}
			newCareerSiteIDs = append(newCareerSiteIDs, careerSiteID)
		}

		// Process new role names
		var newRoleIDs []int
		for _, roleName := range sub.RoleNames {
			roleID, err := getOrCreateRoleIDFunc(roleName)
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
func getOrCreateCareerSiteID(url string, companyID int) (int, error) {
	var careerSiteID int
	err := db.DB.QueryRow("SELECT id FROM career_sites WHERE link = $1", url).Scan(&careerSiteID)
	if err == sql.ErrNoRows {
		err = db.DB.QueryRow("INSERT INTO career_sites (company_id,link) VALUES ($1,$2) RETURNING id", companyID, url).Scan(&careerSiteID)
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

// SubscriptionResponse represents the JSON object for each subscription row.
type SubscriptionResponse struct {
	CompanyName string   `json:"companyName"`
	CareerLinks []string `json:"careerLinks"`
	RoleNames   []string `json:"roleNames"`
	Active      bool     `json:"active"`
}

// Request struct to get email
type GetSubscriptionsRequest struct {
	Email string `json:"email"`
}

// FetchUserSubscriptionsHandler retrieves subscriptions based on the provided email.
func FetchUserSubscriptionsHandler(w http.ResponseWriter, r *http.Request) {
	// Decode request to get email
	var req GetSubscriptionsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"message": "Invalid request payload"}`, http.StatusBadRequest)
		return
	}
	if req.Email == "" {
		http.Error(w, `{"message": "Email is required"}`, http.StatusBadRequest)
		return
	}

	// Get user ID from email
	userID, err := getUserIDByEmailFunc(req.Email)
	if err != nil {
		http.Error(w, `{"message": "User not found"}`, http.StatusNotFound)
		return
	}

	// Query subscriptions for the user
	rows, err := db.DB.Query(`
		SELECT id, company_id, career_site_ids, role_ids, active
		FROM subscriptions 
		WHERE user_id=$1`, userID)
	if err != nil {
		http.Error(w, `{"message": "Database error fetching subscriptions"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	// Array to hold subscription responses
	var subscriptions []SubscriptionResponse

	// Loop through each subscription row
	for rows.Next() {
		var id int
		var companyID int
		var careerSiteIDs []int64
		var roleIDs []int64
		var active bool

		if err := rows.Scan(&id, &companyID, pq.Array(&careerSiteIDs), pq.Array(&roleIDs), &active); err != nil {
			http.Error(w, `{"message": "Error scanning subscription row"}`, http.StatusInternalServerError)
			return
		}

		// Get the company name
		companyName, err := getCompanyNameByIDFunc(companyID)
		if err != nil {
			http.Error(w, `{"message": "Error fetching company name"}`, http.StatusInternalServerError)
			return
		}

		// Fetch career site links
		var careerLinks []string
		for _, csid := range careerSiteIDs {
			link, err := getCareerSiteLinkByIDFunc(int(csid))
			if err != nil {
				http.Error(w, `{"message": "Error fetching career site link"}`, http.StatusInternalServerError)
				return
			}
			careerLinks = append(careerLinks, link)
		}

		// Fetch role names
		var roleNames []string
		for _, rid := range roleIDs {
			roleName, err := getRoleNameByIDFunc(int(rid))
			if err != nil {
				http.Error(w, `{"message": "Error fetching role name"}`, http.StatusInternalServerError)
				return
			}
			roleNames = append(roleNames, roleName)
		}

		// Create a subscription response object
		subResp := SubscriptionResponse{
			CompanyName: companyName,
			CareerLinks: careerLinks,
			RoleNames:   roleNames,
			Active: active,

		}
		subscriptions = append(subscriptions, subResp)
	}

	if err := rows.Err(); err != nil {
		http.Error(w, `{"message": "Error iterating subscription rows"}`, http.StatusInternalServerError)
		return
	}

	// Respond with the subscriptions JSON array
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":        "success",
		"subscriptions": subscriptions,
	})
}

// Helper: getCompanyNameByID fetches company name from companies table.
func getCompanyNameByID(companyID int) (string, error) {
	var name string
	err := db.DB.QueryRow("SELECT name FROM companies WHERE id=$1", companyID).Scan(&name)
	if err != nil {
		return "", err
	}
	return name, nil
}

// Helper: getCareerSiteLinkByID fetches career site link from career_sites table.
func getCareerSiteLinkByID(careerSiteID int) (string, error) {
	var link string
	err := db.DB.QueryRow("SELECT link FROM career_sites WHERE id=$1", careerSiteID).Scan(&link)
	if err != nil {
		return "", err
	}
	return link, nil
}

// Helper: getRoleNameByID fetches role name from roles table.
func getRoleNameByID(roleID int) (string, error) {
	var roleName string
	err := db.DB.QueryRow("SELECT name FROM roles WHERE id=$1", roleID).Scan(&roleName)
	if err != nil {
		return "", err
	}
	return roleName, nil
}

// UpdateSubscriptionsRequest represents the incoming JSON payload.
type UpdateSubscriptionsRequest struct {
	Email         string `json:"email"`
	Subscriptions []struct {
		CompanyName string   `json:"companyName"`
		CareerLinks []string `json:"careerLinks,omitempty"`
		RoleNames   []string `json:"roleNames,omitempty"`
		Active    *bool    `json:"active,omitempty"`
	} `json:"subscriptions"`
}

// UpdateSubscriptionsHandler updates subscription records based on the provided payload.
// func UpdateSubscriptionsHandler(w http.ResponseWriter, r *http.Request) {
// 	var req UpdateSubscriptionsRequest

// 	// Decode the request body.
// 	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
// 		http.Error(w, `{"message": "Invalid request payload"}`, http.StatusBadRequest)
// 		return
// 	}

// 	// Validate that an email is provided.
// 	if req.Email == "" {
// 		http.Error(w, `{"message": "Email is required"}`, http.StatusBadRequest)
// 		return
// 	}

// 	// Get the user ID for the given email.
// 	userID, err := getUserIDByEmailFunc(req.Email)
// 	if err != nil {
// 		http.Error(w, `{"message": "User not found. Please sign up."}`, http.StatusNotFound)
// 		return
// 	}

// 	// Process each subscription in the payload.
// 	for _, sub := range req.Subscriptions {
// 		// CompanyName is mandatory.
// 		if sub.CompanyName == "" {
// 			http.Error(w, `{"message": "CompanyName is required for each subscription"}`, http.StatusBadRequest)
// 			return
// 		}

// 		// Get company ID without auto-creation.
// 		companyID, err := getCompanyIDIfExistsFunc(sub.CompanyName)
// 		if err != nil {
// 			http.Error(w, fmt.Sprintf(`{"message": "Company '%s' does not exist"}`, sub.CompanyName), http.StatusBadRequest)
// 			return
// 		}

// 		// Check if a subscription record exists for this user and company.
// 		var subID int
// 		query := "SELECT id FROM subscriptions WHERE user_id=$1 AND company_id=$2"
// 		// err = db.DB.QueryRow(query, userID, companyID).Scan(&subID)
// 		row := db.DB.QueryRow(query, userID, companyID)
// 		err = row.Scan(&subID)
// 		if err != nil {
// 			fmt.Printf("Error scanning row: %v\n", err)
// 		}
// 		if err == sql.ErrNoRows {
// 			http.Error(w, fmt.Sprintf(`{"message": "Subscription for the company %s does not exist"}`, sub.CompanyName), http.StatusBadRequest)
// 			return
// 		} else if err != nil {
// 			http.Error(w, `{"message": "Database error while fetching subscription"}`, http.StatusInternalServerError)
// 			return
// 		}

// 		// Flags for which fields to update.
// 		updateCareerLinks := len(sub.CareerLinks) > 0
// 		updateRoleNames := len(sub.RoleNames) > 0

// 		// If neither field is provided, no update is done.
// 		if !updateCareerLinks && !updateRoleNames {
// 			http.Error(w, `{"message": "No update fields provided"}`, http.StatusBadRequest)
// 			return
// 		}

// 		// Prepare new arrays.
// 		var newCareerSiteIDs []int
// 		if updateCareerLinks {
// 			for _, link := range sub.CareerLinks {
// 				// Using getOrCreate here; if desired you can implement a non-creating variant.
// 				careerSiteID, err := getOrCreateCareerSiteIDFunc(link, companyID)
// 				if err != nil {
// 					http.Error(w, `{"message": "Error processing career site link"}`, http.StatusInternalServerError)
// 					return
// 				}
// 				newCareerSiteIDs = append(newCareerSiteIDs, careerSiteID)
// 			}
// 		}

// 		var newRoleIDs []int
// 		if updateRoleNames {
// 			for _, roleName := range sub.RoleNames {
// 				// Using getOrCreate here; adjust as needed.
// 				roleID, err := getOrCreateRoleIDFunc(roleName)
// 				if err != nil {
// 					http.Error(w, `{"message": "Error processing role name"}`, http.StatusInternalServerError)
// 					return
// 				}
// 				newRoleIDs = append(newRoleIDs, roleID)
// 			}
// 		}

// 		// Convert newCareerSiteIDs and newRoleIDs from []int to []int64
// 		newCareerSiteIDs64 := make([]int64, len(newCareerSiteIDs))
// 		for i, id := range newCareerSiteIDs {
// 			newCareerSiteIDs64[i] = int64(id)
// 		}
// 		newRoleIDs64 := make([]int64, len(newRoleIDs))
// 		for i, id := range newRoleIDs {
// 			newRoleIDs64[i] = int64(id)
// 		}

// 		// Build the UPDATE query based on which fields to update.
// 		now := time.Now().UTC()
// 		if updateCareerLinks && updateRoleNames {
// 			_, err = db.DB.Exec(`
// 				UPDATE subscriptions 
// 				SET career_site_ids=$1, role_ids=$2, interest_time=$3 
// 				WHERE user_id=$4 AND company_id=$5`,
// 				pq.Array(newCareerSiteIDs64), pq.Array(newRoleIDs64), now, userID, companyID)
// 		} else if updateCareerLinks {
// 			_, err = db.DB.Exec(`
// 				UPDATE subscriptions 
// 				SET career_site_ids=$1, interest_time=$2 
// 				WHERE user_id=$3 AND company_id=$4`,
// 				pq.Array(newCareerSiteIDs64), now, userID, companyID)
// 		} else if updateRoleNames {
// 			_, err = db.DB.Exec(`
// 				UPDATE subscriptions 
// 				SET role_ids=$1, interest_time=$2 
// 				WHERE user_id=$3 AND company_id=$4`,
// 				pq.Array(newRoleIDs64), now, userID, companyID)
// 		}

// 		if err != nil {
// 			http.Error(w, `{"message": "Error updating subscription"}`, http.StatusInternalServerError)
// 			return
// 		}
// 	}

// 	// Return a success response.
// 	w.Header().Set("Content-Type", "application/json")
// 	w.WriteHeader(http.StatusOK)
// 	json.NewEncoder(w).Encode(map[string]interface{}{
// 		"message": "Subscription(s) updated successfully",
// 		"status":  "success",
// 	})
// }


// UpdateSubscriptionsHandler updates subscription records based on the provided payload.
func UpdateSubscriptionsHandler(w http.ResponseWriter, r *http.Request) {
	var req UpdateSubscriptionsRequest

	// Decode the request body.
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"message": "Invalid request payload"}`, http.StatusBadRequest)
		return
	}

	// Validate that an email is provided.
	if req.Email == "" {
		http.Error(w, `{"message": "Email is required"}`, http.StatusBadRequest)
		return
	}

	// Get the user ID for the given email.
	userID, err := getUserIDByEmailFunc(req.Email)
	if err != nil {
		http.Error(w, `{"message": "User not found. Please sign up."}`, http.StatusNotFound)
		return
	}

	// Process each subscription in the payload.
	for _, sub := range req.Subscriptions {
		// CompanyName is mandatory.
		if sub.CompanyName == "" {
			http.Error(w, `{"message": "CompanyName is required for each subscription"}`, http.StatusBadRequest)
			return
		}

		// Get company ID without auto-creation.
		companyID, err := getCompanyIDIfExistsFunc(sub.CompanyName)
		if err != nil {
			http.Error(w, fmt.Sprintf(`{"message": "Company '%s' does not exist"}`, sub.CompanyName), http.StatusBadRequest)
			return
		}

		// Check if a subscription record exists for this user and company.
		var subID int
		query := "SELECT id FROM subscriptions WHERE user_id=$1 AND company_id=$2"
		row := db.DB.QueryRow(query, userID, companyID)
		err = row.Scan(&subID)
		if err == sql.ErrNoRows {
			http.Error(w, fmt.Sprintf(`{"message": "Subscription for the company %s does not exist"}`, sub.CompanyName), http.StatusBadRequest)
			return
		} else if err != nil {
			http.Error(w, `{"message": "Database error while fetching subscription"}`, http.StatusInternalServerError)
			return
		}

		// Flags for which fields to update.
		updateCareerLinks := len(sub.CareerLinks) > 0
		updateRoleNames := len(sub.RoleNames) > 0
		updateActive := sub.Active != nil

		// If no update fields are provided, return error.
		if !updateCareerLinks && !updateRoleNames && !updateActive {
			http.Error(w, `{"message": "No update fields provided"}`, http.StatusBadRequest)
			return
		}

		// Prepare new arrays.
		var newCareerSiteIDs []int
		if updateCareerLinks {
			for _, link := range sub.CareerLinks {
				careerSiteID, err := getOrCreateCareerSiteIDFunc(link, companyID)
				if err != nil {
					http.Error(w, `{"message": "Error processing career site link"}`, http.StatusInternalServerError)
					return
				}
				newCareerSiteIDs = append(newCareerSiteIDs, careerSiteID)
			}
		}

		var newRoleIDs []int
		if updateRoleNames {
			for _, roleName := range sub.RoleNames {
				roleID, err := getOrCreateRoleIDFunc(roleName)
				if err != nil {
					http.Error(w, `{"message": "Error processing role name"}`, http.StatusInternalServerError)
					return
				}
				newRoleIDs = append(newRoleIDs, roleID)
			}
		}

		// Convert newCareerSiteIDs and newRoleIDs from []int to []int64.
		newCareerSiteIDs64 := make([]int64, len(newCareerSiteIDs))
		for i, id := range newCareerSiteIDs {
			newCareerSiteIDs64[i] = int64(id)
		}
		newRoleIDs64 := make([]int64, len(newRoleIDs))
		for i, id := range newRoleIDs {
			newRoleIDs64[i] = int64(id)
		}

		now := time.Now().UTC()

		// Build and execute the UPDATE query based on which fields to update.
		var execErr error
		switch {
		case updateCareerLinks && updateRoleNames && updateActive:
			_, execErr = db.DB.Exec(`
				UPDATE subscriptions 
				SET career_site_ids=$1, role_ids=$2, active=$3, interest_time=$4 
				WHERE user_id=$5 AND company_id=$6`,
				pq.Array(newCareerSiteIDs64), pq.Array(newRoleIDs64), *sub.Active, now, userID, companyID)
		case updateCareerLinks && updateRoleNames:
			_, execErr = db.DB.Exec(`
				UPDATE subscriptions 
				SET career_site_ids=$1, role_ids=$2, interest_time=$3 
				WHERE user_id=$4 AND company_id=$5`,
				pq.Array(newCareerSiteIDs64), pq.Array(newRoleIDs64), now, userID, companyID)
		case updateCareerLinks && updateActive:
			_, execErr = db.DB.Exec(`
				UPDATE subscriptions 
				SET career_site_ids=$1, active=$2, interest_time=$3 
				WHERE user_id=$4 AND company_id=$5`,
				pq.Array(newCareerSiteIDs64), *sub.Active, now, userID, companyID)
		case updateRoleNames && updateActive:
			_, execErr = db.DB.Exec(`
				UPDATE subscriptions 
				SET role_ids=$1, active=$2, interest_time=$3 
				WHERE user_id=$4 AND company_id=$5`,
				pq.Array(newRoleIDs64), *sub.Active, now, userID, companyID)
		case updateCareerLinks:
			_, execErr = db.DB.Exec(`
				UPDATE subscriptions 
				SET career_site_ids=$1, interest_time=$2 
				WHERE user_id=$3 AND company_id=$4`,
				pq.Array(newCareerSiteIDs64), now, userID, companyID)
		case updateRoleNames:
			_, execErr = db.DB.Exec(`
				UPDATE subscriptions 
				SET role_ids=$1, interest_time=$2 
				WHERE user_id=$3 AND company_id=$4`,
				pq.Array(newRoleIDs64), now, userID, companyID)
		case updateActive:
			_, execErr = db.DB.Exec(`
				UPDATE subscriptions 
				SET active=$1, interest_time=$2 
				WHERE user_id=$3 AND company_id=$4`,
				*sub.Active, now, userID, companyID)
		}

		if execErr != nil {
			http.Error(w, `{"message": "Error updating subscription"}`, http.StatusInternalServerError)
			return
		}
	}

	// Return a success response.
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Subscription(s) updated successfully",
		"status":  "success",
	})
}

// getCompanyIDIfExists retrieves the company id for a given company name without creating a new entry.
func getCompanyIDIfExists(companyName string) (int, error) {
	var companyID int
	err := db.DB.QueryRow("SELECT id FROM companies WHERE name=$1", companyName).Scan(&companyID)
	if err != nil {
		return 0, err
	}
	return companyID, nil
}

// DeleteSubscriptionsRequest represents the expected payload.
type DeleteSubscriptionsRequest struct {
	Email         string   `json:"email"`
	Subscriptions []string `json:"subscriptions"`
}

// DeleteSubscriptionsHandler deletes subscriptions for the given email and companies.
func DeleteSubscriptionsHandler(w http.ResponseWriter, r *http.Request) {
	var req DeleteSubscriptionsRequest

	// Decode the request body.
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"message": "Invalid request payload"}`, http.StatusBadRequest)
		return
	}

	// Validate that an email is provided.
	if req.Email == "" {
		http.Error(w, `{"message": "Email is required"}`, http.StatusBadRequest)
		return
	}

	// Validate that there is at least one subscription to delete.
	if len(req.Subscriptions) == 0 {
		http.Error(w, `{"message": "No subscriptions provided to delete"}`, http.StatusBadRequest)
		return
	}

	// Get the user ID corresponding to the email.
	userID, err := getUserIDByEmailFunc(req.Email)
	if err != nil {
		http.Error(w, `{"message": "User not found"}`, http.StatusNotFound)
		return
	}

	foundSubscription := false
	userSubscriptions := false

	// Loop through each subscription (company name) in the payload.
	for _, companyName := range req.Subscriptions {
		// Get the company ID corresponding to the company name.
		companyID, err := getCompanyIDIfExistsFunc(companyName)
		if err != nil {
			// If the company doesn't exist, skip it.
			continue
		}
		foundSubscription = true

		// Delete the subscription row where user_id and company_id match.
		res, err := db.DB.Exec("DELETE FROM subscriptions WHERE user_id=$1 AND company_id=$2", userID, companyID)
		if err != nil {
			http.Error(w, `{"message": "Database error while deleting subscription"}`, http.StatusInternalServerError)
			return
		}
		count, err := res.RowsAffected()
		if err == nil && count > 0 {
			userSubscriptions = true
		}
	}

	// If none of the given company names existed in the companies table.
	if !foundSubscription {
		http.Error(w, `{"message": "None of the given subscriptions exist"}`, http.StatusBadRequest)
		return
	}

	if !userSubscriptions {
		http.Error(w, `{"message": "User is not subscribed to any of given subscriptions"}`, http.StatusBadRequest)
		return
	}

	// Respond with a success message.
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Deleted subscription(s) successfully",
		"status":  "success",
	})
}

// FetchAllSubscriptionsResponse represents the JSON structure of the response.
type FetchAllSubscriptionsResponse struct {
	Companies map[string][]string `json:"companies"`
	Roles     []string            `json:"roles"`
}

// FetchAllSubscriptionsHandler fetches all companies with their career links and all roles.
func FetchAllSubscriptionsHandler(w http.ResponseWriter, r *http.Request) {
	// 1. Query companies table to fetch all company IDs and names.
	companyRows, err := db.DB.Query("SELECT id, name FROM companies")
	if err != nil {
		http.Error(w, `{"message": "Error fetching companies"}`, http.StatusInternalServerError)
		return
	}
	defer companyRows.Close()

	// Build a mapping from company id to company name,
	// and initialize a result map to hold company name -> career links.
	companies := make(map[int]string)
	companiesMap := make(map[string][]string)
	for companyRows.Next() {
		var id int
		var name string
		if err := companyRows.Scan(&id, &name); err != nil {
			http.Error(w, `{"message": "Error scanning companies"}`, http.StatusInternalServerError)
			return
		}
		companies[id] = name
		companiesMap[name] = []string{} // initialize slice for career links
	}
	if err := companyRows.Err(); err != nil {
		http.Error(w, `{"message": "Error iterating companies"}`, http.StatusInternalServerError)
		return
	}

	// 2. For each company, query the career_sites table to fetch all links.
	for companyID, companyName := range companies {
		csRows, err := db.DB.Query("SELECT link FROM career_sites WHERE company_id = $1", companyID)
		if err != nil {
			http.Error(w, `{"message": "Error fetching career sites"}`, http.StatusInternalServerError)
			return
		}
		var links []string
		for csRows.Next() {
			var link string
			if err := csRows.Scan(&link); err != nil {
				csRows.Close()
				http.Error(w, `{"message": "Error scanning career site"}`, http.StatusInternalServerError)
				return
			}
			links = append(links, link)
		}
		csRows.Close()
		companiesMap[companyName] = links
	}

	// 3. Query roles table to fetch all role names.
	roleRows, err := db.DB.Query("SELECT name FROM roles")
	if err != nil {
		http.Error(w, `{"message": "Error fetching roles"}`, http.StatusInternalServerError)
		return
	}
	defer roleRows.Close()

	var roles []string
	for roleRows.Next() {
		var roleName string
		if err := roleRows.Scan(&roleName); err != nil {
			http.Error(w, `{"message": "Error scanning roles"}`, http.StatusInternalServerError)
			return
		}
		roles = append(roles, roleName)
	}
	if err := roleRows.Err(); err != nil {
		http.Error(w, `{"message": "Error iterating roles"}`, http.StatusInternalServerError)
		return
	}

	// 4. Build and send the final JSON response.
	response := FetchAllSubscriptionsResponse{
		Companies: companiesMap,
		Roles:     roles,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}
