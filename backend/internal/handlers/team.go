package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sogos/mirai-backend/internal/middleware"
	"github.com/sogos/mirai-backend/internal/models"
	"github.com/sogos/mirai-backend/internal/repository"
)

// TeamHandler handles team-related requests
type TeamHandler struct {
	userRepo *repository.UserRepository
	teamRepo *repository.TeamRepository
}

// NewTeamHandler creates a new team handler
func NewTeamHandler(userRepo *repository.UserRepository, teamRepo *repository.TeamRepository) *TeamHandler {
	return &TeamHandler{
		userRepo: userRepo,
		teamRepo: teamRepo,
	}
}

// ListTeams handles GET /api/v1/teams
func (h *TeamHandler) ListTeams(c *gin.Context) {
	kratosID, err := middleware.GetKratosID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	user, err := h.userRepo.GetByKratosID(kratosID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get user"})
		return
	}
	if user == nil || user.CompanyID == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user has no company"})
		return
	}

	teams, err := h.teamRepo.ListByCompanyID(*user.CompanyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list teams"})
		return
	}

	c.JSON(http.StatusOK, teams)
}

// CreateTeam handles POST /api/v1/teams
func (h *TeamHandler) CreateTeam(c *gin.Context) {
	kratosID, err := middleware.GetKratosID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	user, err := h.userRepo.GetByKratosID(kratosID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get user"})
		return
	}
	if user == nil || user.CompanyID == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user has no company"})
		return
	}

	var req models.CreateTeamRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	team := &models.Team{
		CompanyID:   *user.CompanyID,
		Name:        req.Name,
		Description: &req.Description,
	}
	if err := h.teamRepo.Create(team); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create team"})
		return
	}

	c.JSON(http.StatusCreated, team)
}

// GetTeam handles GET /api/v1/teams/:id
func (h *TeamHandler) GetTeam(c *gin.Context) {
	kratosID, err := middleware.GetKratosID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	teamID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid team ID"})
		return
	}

	user, err := h.userRepo.GetByKratosID(kratosID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get user"})
		return
	}
	if user == nil || user.CompanyID == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user has no company"})
		return
	}

	team, err := h.teamRepo.GetByID(teamID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get team"})
		return
	}
	if team == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "team not found"})
		return
	}

	// Ensure team belongs to user's company
	if team.CompanyID != *user.CompanyID {
		c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
		return
	}

	c.JSON(http.StatusOK, team)
}

// UpdateTeam handles PUT /api/v1/teams/:id
func (h *TeamHandler) UpdateTeam(c *gin.Context) {
	kratosID, err := middleware.GetKratosID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	teamID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid team ID"})
		return
	}

	user, err := h.userRepo.GetByKratosID(kratosID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get user"})
		return
	}
	if user == nil || user.CompanyID == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user has no company"})
		return
	}

	team, err := h.teamRepo.GetByID(teamID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get team"})
		return
	}
	if team == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "team not found"})
		return
	}

	// Ensure team belongs to user's company
	if team.CompanyID != *user.CompanyID {
		c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
		return
	}

	var req models.UpdateTeamRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update fields if provided
	if req.Name != "" {
		team.Name = req.Name
	}
	if req.Description != "" {
		team.Description = &req.Description
	}

	if err := h.teamRepo.Update(team); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update team"})
		return
	}

	c.JSON(http.StatusOK, team)
}

// DeleteTeam handles DELETE /api/v1/teams/:id
func (h *TeamHandler) DeleteTeam(c *gin.Context) {
	kratosID, err := middleware.GetKratosID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	teamID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid team ID"})
		return
	}

	user, err := h.userRepo.GetByKratosID(kratosID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get user"})
		return
	}
	if user == nil || user.CompanyID == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user has no company"})
		return
	}

	team, err := h.teamRepo.GetByID(teamID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get team"})
		return
	}
	if team == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "team not found"})
		return
	}

	// Ensure team belongs to user's company
	if team.CompanyID != *user.CompanyID {
		c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
		return
	}

	if err := h.teamRepo.Delete(teamID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete team"})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

// ListTeamMembers handles GET /api/v1/teams/:id/members
func (h *TeamHandler) ListTeamMembers(c *gin.Context) {
	kratosID, err := middleware.GetKratosID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	teamID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid team ID"})
		return
	}

	user, err := h.userRepo.GetByKratosID(kratosID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get user"})
		return
	}
	if user == nil || user.CompanyID == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user has no company"})
		return
	}

	team, err := h.teamRepo.GetByID(teamID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get team"})
		return
	}
	if team == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "team not found"})
		return
	}

	// Ensure team belongs to user's company
	if team.CompanyID != *user.CompanyID {
		c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
		return
	}

	members, err := h.teamRepo.ListMembers(teamID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list members"})
		return
	}

	c.JSON(http.StatusOK, members)
}

// AddTeamMember handles POST /api/v1/teams/:id/members
func (h *TeamHandler) AddTeamMember(c *gin.Context) {
	kratosID, err := middleware.GetKratosID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	teamID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid team ID"})
		return
	}

	user, err := h.userRepo.GetByKratosID(kratosID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get user"})
		return
	}
	if user == nil || user.CompanyID == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user has no company"})
		return
	}

	team, err := h.teamRepo.GetByID(teamID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get team"})
		return
	}
	if team == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "team not found"})
		return
	}

	// Ensure team belongs to user's company
	if team.CompanyID != *user.CompanyID {
		c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
		return
	}

	var req models.AddTeamMemberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify the user to add belongs to the same company
	userToAdd, err := h.userRepo.GetByID(req.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get user"})
		return
	}
	if userToAdd == nil || userToAdd.CompanyID == nil || *userToAdd.CompanyID != *user.CompanyID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user not found in company"})
		return
	}

	member := &models.TeamMember{
		TeamID: teamID,
		UserID: req.UserID,
		Role:   req.Role,
	}
	if err := h.teamRepo.AddMember(member); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to add team member"})
		return
	}

	c.JSON(http.StatusCreated, member)
}

// RemoveTeamMember handles DELETE /api/v1/teams/:id/members/:uid
func (h *TeamHandler) RemoveTeamMember(c *gin.Context) {
	kratosID, err := middleware.GetKratosID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	teamID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid team ID"})
		return
	}

	userID, err := uuid.Parse(c.Param("uid"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	user, err := h.userRepo.GetByKratosID(kratosID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get user"})
		return
	}
	if user == nil || user.CompanyID == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user has no company"})
		return
	}

	team, err := h.teamRepo.GetByID(teamID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get team"})
		return
	}
	if team == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "team not found"})
		return
	}

	// Ensure team belongs to user's company
	if team.CompanyID != *user.CompanyID {
		c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
		return
	}

	if err := h.teamRepo.RemoveMember(teamID, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to remove team member"})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}
