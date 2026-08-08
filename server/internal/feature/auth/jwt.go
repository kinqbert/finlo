package auth

import (
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const (
	AccessTokenType  = "access"
	RefreshTokenType = "refresh"
)

var ErrInvalidToken = errors.New("invalid access token")

type TokenService struct {
	accessSecret  []byte
	refreshSecret []byte
	issuer        string
	audience      string
}

type Claims struct {
	TokenType string `json:"token_type"`
	jwt.RegisteredClaims
}

func NewTokenService(
	accessSecret string,
	refreshSecret string,
	issuer string,
	audience string,
) *TokenService {
	return &TokenService{
		accessSecret:  []byte(accessSecret),
		refreshSecret: []byte(refreshSecret),
		issuer:        issuer,
		audience:      audience,
	}
}

func (s *TokenService) Generate(userId string) (Tokens, error) {
	now := time.Now()

	accessClaims := Claims{
		TokenType: AccessTokenType,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userId,
			Issuer:    s.issuer,
			Audience:  jwt.ClaimStrings{s.audience},
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(15 * time.Minute)),
		},
	}

	refreshClaims := Claims{
		TokenType: RefreshTokenType,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userId,
			Issuer:    s.issuer,
			Audience:  jwt.ClaimStrings{s.audience},
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(30 * 24 * time.Hour)),
		},
	}

	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)

	signedAccessToken, err := accessToken.SignedString(s.accessSecret)
	if err != nil {
		return Tokens{}, fmt.Errorf("sign JWT: %w", err)
	}

	signedRefreshToken, err := refreshToken.SignedString(s.refreshSecret)
	if err != nil {
		return Tokens{}, fmt.Errorf("sign JWT: %w", err)
	}

	return Tokens{
		Access:  signedAccessToken,
		Refresh: signedRefreshToken,
	}, nil
}

func (s *TokenService) ParseAccess(token string) (string, error) {
	return s.parse(token, AccessTokenType)
}

func (s *TokenService) ParseRefresh(token string) (string, error) {
	return s.parse(token, RefreshTokenType)
}

func (s *TokenService) parse(rawToken string, tokenType string) (string, error) {
	var secret []byte

	switch tokenType {
	case AccessTokenType:
		secret = s.accessSecret
	case RefreshTokenType:
		secret = s.refreshSecret
	default:
		return "", ErrInvalidToken
	}

	token, err := jwt.ParseWithClaims(
		rawToken,
		&Claims{},
		func(token *jwt.Token) (any, error) {
			return secret, nil
		},
		jwt.WithValidMethods([]string{
			jwt.SigningMethodHS256.Alg(),
		}),
		jwt.WithIssuer(s.issuer),
		jwt.WithAudience(s.audience),
		jwt.WithExpirationRequired(),
	)

	if err != nil || !token.Valid {
		return "", ErrInvalidToken
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || claims.Subject == "" || claims.TokenType != tokenType {
		return "", ErrInvalidToken
	}

	return claims.Subject, nil
}
