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
