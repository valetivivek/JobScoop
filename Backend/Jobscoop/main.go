package main

import (
	"JobScoop/internal/db" // Import the db package
	"JobScoop/internal/models"
	"JobScoop/routes" // Import the routes package (where you define your routes)
	"fmt"
	"log"
	"net/http"
)

func main() {
	// Initialize the DB connection
	db.ConnectDB()
	models.CreateUserTable()
	// Register your routes
	var router = routes.RegisterRoutes()

	// Start the server
	port := "8080"
	fmt.Println("Server running on port", port)
	log.Fatal(http.ListenAndServe(":"+port, router)) // Start the server using Mux router
}