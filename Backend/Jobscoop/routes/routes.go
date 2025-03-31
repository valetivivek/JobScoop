package routes

import (
	user "JobScoop/internal/handlers"
	subscription "JobScoop/internal/handlers"
	"JobScoop/internal/middleware"
	"net/http"

	"github.com/gorilla/mux"
)

func RegisterRoutes() *mux.Router {
	router := mux.NewRouter()
	router.Use(middleware.CORS)
	router.HandleFunc("/signup", user.SignupHandler).Methods(http.MethodPost)
	router.HandleFunc("/signup", user.SignupHandler).Methods(http.MethodOptions)

	router.HandleFunc("/login", user.LoginHandler).Methods(http.MethodPost)
	router.HandleFunc("/login", user.LoginHandler).Methods(http.MethodOptions)

	router.HandleFunc("/forgot-password", user.ForgotPasswordHandler).Methods(http.MethodPost)
	router.HandleFunc("/forgot-password", user.ForgotPasswordHandler).Methods(http.MethodOptions)

	router.HandleFunc("/verify-code", user.VerifyCodeHandler).Methods(http.MethodPost)
	router.HandleFunc("/verify-code", user.VerifyCodeHandler).Methods(http.MethodOptions)

	router.HandleFunc("/reset-password", user.ResetPasswordHandler).Methods(http.MethodPut)
	router.HandleFunc("/reset-password", user.ResetPasswordHandler).Methods(http.MethodOptions)

	router.HandleFunc("/save-subscriptions", subscription.SaveSubscriptionsHandler).Methods(http.MethodPost)
	router.HandleFunc("/save-subscriptions", subscription.SaveSubscriptionsHandler).Methods(http.MethodOptions)

	router.HandleFunc("/fetch-user-subscriptions", subscription.FetchUserSubscriptionsHandler).Methods(http.MethodPost)
	router.HandleFunc("/fetch-user-subscriptions", subscription.FetchUserSubscriptionsHandler).Methods(http.MethodOptions)

	router.HandleFunc("/update-subscriptions", subscription.UpdateSubscriptionsHandler).Methods(http.MethodPut)
	router.HandleFunc("/update-subscriptions", subscription.UpdateSubscriptionsHandler).Methods(http.MethodOptions)

	router.HandleFunc("/delete-subscriptions", subscription.DeleteSubscriptionsHandler).Methods(http.MethodPost)
	router.HandleFunc("/delete-subscriptions", subscription.DeleteSubscriptionsHandler).Methods(http.MethodOptions)

	router.HandleFunc("/fetch-all-subscriptions", subscription.FetchAllSubscriptionsHandler).Methods(http.MethodGet)
	router.HandleFunc("/fetch-all-subscriptions", subscription.FetchAllSubscriptionsHandler).Methods(http.MethodOptions)

	router.HandleFunc("/get-user", user.GetUser).Methods(http.MethodGet)
	router.HandleFunc("/get-user", user.GetUser).Methods(http.MethodOptions)

	router.HandleFunc("/subscriptions/jobs", jobs.GetAllJobs).Methods(http.MethodPost)
	router.HandleFunc("/subscriptions/jobs", jobs.GetAllJobs).Methods(http.MethodOptions)

	return router
}
