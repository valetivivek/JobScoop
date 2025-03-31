package handlers

import (
	"JobScoop/internal/db"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"

	"github.com/lib/pq"
)

var (
	fetchJobsFunc = fetchJobs
)

func GetAllJobs(w http.ResponseWriter, r *http.Request) {
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
		SELECT id, company_id, career_site_ids, role_ids 
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

		if err := rows.Scan(&id, &companyID, pq.Array(&careerSiteIDs), pq.Array(&roleIDs)); err != nil {
			http.Error(w, `{"message": "Error scanning subscription row"}`, http.StatusInternalServerError)
			return
		}

		// Get the company name
		companyName, err := getCompanyNameByIDFunc(companyID)
		if err != nil {
			http.Error(w, `{"message": "Error fetching company name"}`, http.StatusInternalServerError)
			return
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
			RoleNames:   roleNames,
		}
		subscriptions = append(subscriptions, subResp)
	}

	if err := rows.Err(); err != nil {
		http.Error(w, `{"message": "Error iterating subscription rows"}`, http.StatusInternalServerError)
		return
	}

	fmt.Printf("I am here, fetchJobsFunc address: %p\n", fetchJobsFunc)

	// New functionality: Fetch jobs for each role within each subscription
	var allJobs []map[string]interface{}
	for _, sub := range subscriptions {
		for _, roleName := range sub.RoleNames {
			fmt.Printf("I am here, fetchJobsFunc address: %p\n", fetchJobsFunc)
			jobs, err := fetchJobsFunc(sub.CompanyName, roleName, w) // Assuming fetchJobs takes company name and role name
			if err != nil {
				http.Error(w, `{"message": "Error fetching jobs"}`, http.StatusInternalServerError)
				return
			}
			allJobs = append(allJobs, jobs...)
		}
	}

	// Construct final response
	response := map[string]interface{}{
		"jobs": allJobs,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)

}

const (
	ScrapingDogLinkedInAPI = "http://api.scrapingdog.com/linkedinjobs"
	// ScrapingDogIndeedAPI   = "http://api.scrapingdog.com/indeed"
)

func fetchLinkedInJobs(apiKey, field, geoid, page, sort_by string) ([]map[string]interface{}, error) {
	params := url.Values{}
	params.Add("api_key", apiKey)
	params.Add("field", field)
	params.Add("geoid", geoid)
	params.Add("page", page)
	params.Add("sort_by", sort_by)
	// params.Add("filter_by_company", filter_by_company)
	url := ScrapingDogLinkedInAPI + "?" + params.Encode()
	// fmt.Println(url)
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	// LinkedIn returns an array, so we parse into a slice of maps
	var apiResponse []map[string]interface{}
	err = json.Unmarshal(body, &apiResponse)
	if err != nil {
		return nil, err
	}
	// fmt.Println("I am here in fetchlinkedin jobs and this below is the output.")
	// fmt.Println(apiResponse)
	return apiResponse, nil
}
