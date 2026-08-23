package category

type CreateInput struct {
	Name string `json:"name" validate:"required,notblank,max=100"`
	Type string `json:"type" validate:"required,oneof=income expense"`
}

type UpdateInput struct {
	Name string `json:"name" validate:"required,notblank,max=100"`
}

type ReorderInput struct {
	Type        string   `json:"type" validate:"required,oneof=income expense"`
	CategoryIDs []string `json:"category_ids" validate:"required,min=1,dive,uuid"`
}
