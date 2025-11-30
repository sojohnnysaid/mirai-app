package valueobject

import "fmt"

// PendingRegistrationStatus represents the status of a pending registration.
type PendingRegistrationStatus string

const (
	// PendingRegistrationStatusPending means the user has started registration but not paid.
	PendingRegistrationStatusPending PendingRegistrationStatus = "pending"
	// PendingRegistrationStatusPaid means payment was confirmed via Stripe webhook.
	PendingRegistrationStatusPaid PendingRegistrationStatus = "paid"
	// PendingRegistrationStatusProvisioning means account creation is in progress.
	PendingRegistrationStatusProvisioning PendingRegistrationStatus = "provisioning"
	// PendingRegistrationStatusFailed means account creation failed.
	PendingRegistrationStatusFailed PendingRegistrationStatus = "failed"
)

// String returns the string representation of the status.
func (s PendingRegistrationStatus) String() string {
	return string(s)
}

// IsValid checks if the status is valid.
func (s PendingRegistrationStatus) IsValid() bool {
	switch s {
	case PendingRegistrationStatusPending, PendingRegistrationStatusPaid,
		PendingRegistrationStatusProvisioning, PendingRegistrationStatusFailed:
		return true
	}
	return false
}

// IsPending returns true if the status is pending (awaiting payment).
func (s PendingRegistrationStatus) IsPending() bool {
	return s == PendingRegistrationStatusPending
}

// IsPaid returns true if payment has been confirmed.
func (s PendingRegistrationStatus) IsPaid() bool {
	return s == PendingRegistrationStatusPaid
}

// IsReadyForProvisioning returns true if the registration is ready to be provisioned.
func (s PendingRegistrationStatus) IsReadyForProvisioning() bool {
	return s == PendingRegistrationStatusPaid
}

// ParsePendingRegistrationStatus parses a string into a PendingRegistrationStatus.
func ParsePendingRegistrationStatus(s string) (PendingRegistrationStatus, error) {
	status := PendingRegistrationStatus(s)
	if !status.IsValid() {
		return "", fmt.Errorf("invalid pending registration status: %s", s)
	}
	return status, nil
}
