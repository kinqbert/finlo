package emergencyfund

type UpdateInput struct {
	TargetMinor  int64  `json:"target_minor" validate:"required,gt=0"`
	CurrentMinor int64  `json:"current_minor" validate:"gte=0"`
	Currency     string `json:"currency" validate:"required,alpha,len=3"`
}
