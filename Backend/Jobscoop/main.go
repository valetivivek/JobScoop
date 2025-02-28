package main

import (
	"JobScoop/internal/db" // Import the db package
	"JobScoop/internal/models"
	"JobScoop/routes" // Import the routes package (where you define your routes)
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func main() {
	// Initialize the DB connection
	db.ConnectDB()
	defer func() {
		if db.DB != nil {
			db.DB.Close()
			fmt.Println("Database connection closed successfully.")
		}
	}()

	// Create tables
	models.CreateUserTable()
	models.CreateResetTokensTable()
	models.CreateCompanyTable()

	// Register your routes
	router := routes.RegisterRoutes()

	// Start the server in a separate goroutine
	port := "8080"
	server := &http.Server{
		Addr:    ":" + port,
		Handler: router,
	}

	go func() {
		fmt.Println("Server running on port", port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Could not listen on port %s: %v\n", port, err)
		}
	}()

	// Wait for an interrupt signal to gracefully shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit
	fmt.Println("\nShutting down server...")

	// Create a context with timeout to ensure cleanup
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	fmt.Println("Server exiting")
}
