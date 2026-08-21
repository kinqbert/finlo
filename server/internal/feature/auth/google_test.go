package auth

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"encoding/base64"
	"math/big"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func TestGoogleVerifierVerify(t *testing.T) {
	privateKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatal(err)
	}

	kid := "test-key"
	verifier := NewGoogleVerifier([]string{"finlo-client"})
	publicKey, err := parseRSAKey(jsonWebKey{
		KeyType:   "RSA",
		KeyID:     kid,
		Algorithm: "RS256",
		Modulus:   base64.RawURLEncoding.EncodeToString(privateKey.N.Bytes()),
		Exponent:  base64.RawURLEncoding.EncodeToString(big.NewInt(int64(privateKey.E)).Bytes()),
	})
	if err != nil {
		t.Fatal(err)
	}
	verifier.keys.keys = map[string]*rsa.PublicKey{kid: publicKey}
	verifier.keys.expiresAt = time.Now().Add(time.Hour)

	now := time.Now()
	claims := googleClaims{
		Email:         "PERSON@Example.COM",
		EmailVerified: true,
		GivenName:     "Person",
		FamilyName:    "Example",
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   "google-user-1",
			Issuer:    "https://accounts.google.com",
			Audience:  jwt.ClaimStrings{"finlo-client"},
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(time.Hour)),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
	token.Header["kid"] = kid
	rawToken, err := token.SignedString(privateKey)
	if err != nil {
		t.Fatal(err)
	}

	identity, err := verifier.Verify(context.Background(), rawToken)
	if err != nil {
		t.Fatalf("Verify() error = %v", err)
	}
	if identity.Subject != "google-user-1" || identity.Email != "person@example.com" {
		t.Fatalf("Verify() identity = %#v", identity)
	}
}

func TestGoogleVerifierRejectsWrongAudience(t *testing.T) {
	verifier := NewGoogleVerifier([]string{"expected-client"})

	privateKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatal(err)
	}
	verifier.keys.keys = map[string]*rsa.PublicKey{"test-key": &privateKey.PublicKey}
	verifier.keys.expiresAt = time.Now().Add(time.Hour)

	claims := googleClaims{
		Email:         "person@example.com",
		EmailVerified: true,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   "google-user-1",
			Issuer:    "https://accounts.google.com",
			Audience:  jwt.ClaimStrings{"another-client"},
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
	token.Header["kid"] = "test-key"
	rawToken, err := token.SignedString(privateKey)
	if err != nil {
		t.Fatal(err)
	}

	if _, err := verifier.Verify(context.Background(), rawToken); err != ErrInvalidGoogleToken {
		t.Fatalf("Verify() error = %v, want %v", err, ErrInvalidGoogleToken)
	}
}

func TestCacheDuration(t *testing.T) {
	if got := cacheDuration("public, max-age=120, must-revalidate"); got != 2*time.Minute {
		t.Fatalf("cacheDuration() = %v, want %v", got, 2*time.Minute)
	}
}
