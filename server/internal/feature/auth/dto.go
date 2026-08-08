package auth

import "time"

type RegisterBodyDTO struct {
	Name     string `json:"name" validate:"required,notblank,max=100"`
	Surname  string `json:"surname" validate:"required,notblank,max=100"`
	Email    string `json:"email" validate:"required,email,max=320"`
	Password string `json:"password" validate:"required"`
}

type LoginBodyDTO struct {
	Email    string `json:"email" validate:"required,email,max=320"`
	Password string `json:"password" validate:"required"`
}

type RefreshBodyDTO struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

type Tokens struct {
	Refresh string `json:"refresh_token"`
	Access  string `json:"access_token"`
}

type UserDTO struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Surname   string `json:"surname"`
	Email     string `json:"email"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

func MapUserToDto(user User) UserDTO {
	return UserDTO{
		ID:        user.ID,
		Name:      user.Name,
		Surname:   user.Surname,
		Email:     user.Email,
		CreatedAt: user.CreatedAt.UTC().Format(time.RFC3339),
		UpdatedAt: user.UpdatedAt.UTC().Format(time.RFC3339),
	}
}
