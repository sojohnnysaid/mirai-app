package valueobject

import "fmt"

// ExperienceLevel represents the learner's experience level.
type ExperienceLevel string

const (
	ExperienceLevelBeginner     ExperienceLevel = "beginner"
	ExperienceLevelIntermediate ExperienceLevel = "intermediate"
	ExperienceLevelAdvanced     ExperienceLevel = "advanced"
	ExperienceLevelExpert       ExperienceLevel = "expert"
)

// TargetAudienceStatus represents the state of a target audience template.
type TargetAudienceStatus string

const (
	TargetAudienceStatusActive   TargetAudienceStatus = "active"
	TargetAudienceStatusArchived TargetAudienceStatus = "archived"
)

func (e ExperienceLevel) String() string {
	return string(e)
}

func (e ExperienceLevel) IsValid() bool {
	switch e {
	case ExperienceLevelBeginner, ExperienceLevelIntermediate,
		ExperienceLevelAdvanced, ExperienceLevelExpert:
		return true
	}
	return false
}

func ParseExperienceLevel(str string) (ExperienceLevel, error) {
	e := ExperienceLevel(str)
	if !e.IsValid() {
		return "", fmt.Errorf("invalid experience level: %s", str)
	}
	return e, nil
}

func (s TargetAudienceStatus) String() string {
	return string(s)
}

func (s TargetAudienceStatus) IsValid() bool {
	switch s {
	case TargetAudienceStatusActive, TargetAudienceStatusArchived:
		return true
	}
	return false
}

func ParseTargetAudienceStatus(str string) (TargetAudienceStatus, error) {
	s := TargetAudienceStatus(str)
	if !s.IsValid() {
		return "", fmt.Errorf("invalid target audience status: %s", str)
	}
	return s, nil
}
