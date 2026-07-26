package auth

type RegisterDTO struct {
	Name     string `json:"name"`
	Surname  string `json:"surname"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginDTO struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type RefreshDTO struct {
	RefreshToken string `json:"refresh_token"`
}

type Tokens struct {
	Refresh string `json:"refresh_token"`
	Access  string `json:"access_token"`
}
