package goal

type CreateInput struct {
	Name         string `json:"name" validate:"required,notblank,max=100"`
	CurrentMinor int64  `json:"current_minor" validate:"gte=0"`
	TargetMinor  *int64 `json:"target_minor" validate:"omitempty,gt=0"`
	Currency     string `json:"currency" validate:"required,supportedcurrency"`
}

type UpdateInput struct {
	Name         *string `json:"name" validate:"omitempty,notblank,max=100"`
	CurrentMinor *int64  `json:"current_minor" validate:"omitempty,gte=0"`
	TargetMinor  *int64  `json:"target_minor" validate:"omitempty,gt=0"`
	ClearTarget  bool    `json:"clear_target"`
}
