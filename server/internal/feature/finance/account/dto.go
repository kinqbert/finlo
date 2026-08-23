package account

type CreateInput struct {
	Name         string `json:"name" validate:"required,notblank,max=100"`
	Type         string `json:"type" validate:"required,oneof=cash bank card savings other"`
	Currency     string `json:"currency" validate:"required,supportedcurrency"`
	BalanceMinor int64  `json:"balance_minor"`
}

type UpdateInput struct {
	Name         *string `json:"name" validate:"omitempty,notblank,max=100"`
	Type         *string `json:"type" validate:"omitempty,oneof=cash bank card savings other"`
	BalanceMinor *int64  `json:"balance_minor"`
}
