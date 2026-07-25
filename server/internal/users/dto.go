package users

import "time"

type CreateUserInput struct {
	Name    string `json:"name"`
	Surname string `json:"surname"`
}

type GetUserByIDResponse struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Surname   string    `json:"surname"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func MapUserToResponse(user User) GetUserByIDResponse {
	return GetUserByIDResponse{
		ID:        user.ID,
		Name:      user.Name,
		Surname:   user.Surname,
		CreatedAt: user.CreatedAt,
		UpdatedAt: user.UpdatedAt,
	}
}
