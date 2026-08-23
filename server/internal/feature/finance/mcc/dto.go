package mcc

type SaveRuleInput struct {
	MCC             int    `json:"mcc" validate:"gte=0,lte=9999"`
	TransactionType string `json:"transaction_type" validate:"required,oneof=income expense"`
	CategoryID      string `json:"category_id" validate:"required,uuid"`
}

type AssignCategoryInput struct {
	CategoryID string `json:"category_id" validate:"required,uuid"`
	Remember   bool   `json:"remember_mcc"`
}
