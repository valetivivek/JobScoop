package handlers

import (
	"JobScoop/internal/db"
	"bytes"
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/lib/pq"
	"github.com/stretchr/testify/assert"
)

// Mock implementations of helper functions
func mockGetUserIDByEmail(email string) (int, error) {
	if email == "test@example.com" {
		return 1, nil
	}
	return 0, errors.New("user not found")
}

func mockGetOrCreateCompanyID(companyName string) (int, error) {
	return 1, nil
}

func mockGetOrCreateCareerSiteID(url string, companyID int) (int, error) {
	return 1, nil
}

func mockGetOrCreateRoleID(roleName string) (int, error) {
	return 1, nil
}

func mockGetCompanyIDIfExists(companyName string) (int, error) {
	if companyName == "TestCompany" {
		return 1, nil
	}
	return 0, errors.New("company not found")
}

func mockGetCompanyNameByID(companyID int) (string, error) {
	if companyID == 1 {
		return "Mock Company", nil
	}
	return "", errors.New("company not found")
}

func mockGetCareerSiteLinkByID(careerSiteID int) (string, error) {
	return "https://mock-career.com", nil
}

func mockGetRoleNameByID(roleID int) (string, error) {
	return "Mock Role", nil
}

func TestSaveSubscriptionsHandler(t *testing.T) {
	// Mock the database
	mockDB, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer mockDB.Close()

	// Replace the actual DB with the mock
	db.DB = mockDB

	// Override function pointers with mock functions
	getUserIDByEmailFunc = mockGetUserIDByEmail
	getOrCreateCompanyIDFunc = mockGetOrCreateCompanyID
	getOrCreateCareerSiteIDFunc = mockGetOrCreateCareerSiteID
	getOrCreateRoleIDFunc = mockGetOrCreateRoleID

	// Construct request payload
	reqBody := map[string]interface{}{
		"email": "test@example.com",
		"subscriptions": []map[string]interface{}{
			{
				"companyName": "Test Company",
				"careerLinks": []string{"https://test.com/careers"},
				"roleNames":   []string{"Software Engineer"},
			},
		},
	}
	jsonData, _ := json.Marshal(reqBody)

	// Expect query to check for existing subscription
	mock.ExpectQuery("SELECT career_site_ids, role_ids FROM subscriptions").
		WithArgs(1, 1).
		WillReturnError(sql.ErrNoRows)

	// Expect query to insert new subscription
	mock.ExpectExec("INSERT INTO subscriptions").
		WithArgs(1, 1, pq.Array([]int64{1}), pq.Array([]int64{1}), sqlmock.AnyArg()).
		WillReturnResult(sqlmock.NewResult(1, 1))

	// Create a request
	r := httptest.NewRequest("POST", "/save-subscription", bytes.NewBuffer(jsonData))
	r.Header.Set("Content-Type", "application/json")

	// Create a ResponseRecorder to capture the response
	w := httptest.NewRecorder()

	// Call the handler
	SaveSubscriptionsHandler(w, r)

	// Validate response
	assert.Equal(t, http.StatusOK, w.Code)

	var resp map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.Equal(t, "Subscription processed successfully", resp["message"])
	assert.Equal(t, "success", resp["status"])

	// Ensure all expectations were met
	assert.NoError(t, mock.ExpectationsWereMet())
}
