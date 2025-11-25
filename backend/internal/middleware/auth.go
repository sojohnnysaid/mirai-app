package middleware

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// KratosSession represents the Kratos session response
type KratosSession struct {
	ID       string `json:"id"`
	Active   bool   `json:"active"`
	Identity struct {
		ID     string `json:"id"`
		Traits struct {
			Email string `json:"email"`
			Name  struct {
				First string `json:"first"`
				Last  string `json:"last"`
			} `json:"name"`
		} `json:"traits"`
	} `json:"identity"`
}

// KratosAuth creates a middleware that validates Kratos sessions
func KratosAuth(kratosURL string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Create a new request to Kratos /sessions/whoami
		req, err := http.NewRequest("GET", kratosURL+"/sessions/whoami", nil)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
				"error": "failed to create auth request",
			})
			return
		}

		// Forward cookies from the original request
		for _, cookie := range c.Request.Cookies() {
			req.AddCookie(cookie)
		}

		// Make the request to Kratos
		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
				"error": "failed to validate session",
			})
			return
		}
		defer resp.Body.Close()

		// Check if the session is valid
		if resp.StatusCode != http.StatusOK {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "unauthorized",
			})
			return
		}

		// Parse the session response
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
				"error": "failed to read session response",
			})
			return
		}

		var session KratosSession
		if err := json.Unmarshal(body, &session); err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
				"error": "failed to parse session response",
			})
			return
		}

		// Verify the session is active
		if !session.Active {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "session is not active",
			})
			return
		}

		// Parse the Kratos ID as UUID
		kratosID, err := uuid.Parse(session.Identity.ID)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
				"error": "invalid kratos ID format",
			})
			return
		}

		// Add the kratos_id and session to the context
		c.Set("kratos_id", kratosID)
		c.Set("kratos_session", session)
		c.Set("email", session.Identity.Traits.Email)
		c.Set("name", fmt.Sprintf("%s %s", session.Identity.Traits.Name.First, session.Identity.Traits.Name.Last))

		c.Next()
	}
}

// GetKratosID retrieves the Kratos ID from the context
func GetKratosID(c *gin.Context) (uuid.UUID, error) {
	kratosID, exists := c.Get("kratos_id")
	if !exists {
		return uuid.Nil, fmt.Errorf("kratos_id not found in context")
	}
	return kratosID.(uuid.UUID), nil
}
