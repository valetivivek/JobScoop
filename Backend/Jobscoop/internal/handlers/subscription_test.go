package handlers

import (
	"errors"
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
