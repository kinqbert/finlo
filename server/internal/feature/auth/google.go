package auth

import (
	"context"
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"math/big"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

const googleJWKSURL = "https://www.googleapis.com/oauth2/v3/certs"

var (
	ErrInvalidGoogleToken  = errors.New("invalid Google token")
	ErrGoogleUnavailable   = errors.New("Google authentication unavailable")
	ErrGoogleNotConfigured = errors.New("Google authentication not configured")
)

type GoogleIdentity struct {
	UserID     string
	Subject    string
	Email      string
	GivenName  string
	FamilyName string
	AvatarURL  string
}

type GoogleTokenVerifier interface {
	Verify(ctx context.Context, rawToken string) (GoogleIdentity, error)
}

type GoogleVerifier struct {
	clientIDs map[string]struct{}
	keys      *googleKeySet
}

func NewGoogleVerifier(clientIDs []string) *GoogleVerifier {
	allowedClientIDs := make(map[string]struct{}, len(clientIDs))
	for _, clientID := range clientIDs {
		if clientID = strings.TrimSpace(clientID); clientID != "" {
			allowedClientIDs[clientID] = struct{}{}
		}
	}
	return &GoogleVerifier{
		clientIDs: allowedClientIDs,
		keys: &googleKeySet{
			client: &http.Client{Timeout: 5 * time.Second},
			url:    googleJWKSURL,
		},
	}
}

type googleClaims struct {
	Email         string `json:"email"`
	EmailVerified bool   `json:"email_verified"`
	GivenName     string `json:"given_name"`
	FamilyName    string `json:"family_name"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
	jwt.RegisteredClaims
}

func (v *GoogleVerifier) Verify(ctx context.Context, rawToken string) (GoogleIdentity, error) {
	if len(v.clientIDs) == 0 {
		return GoogleIdentity{}, ErrGoogleNotConfigured
	}
	if strings.TrimSpace(rawToken) == "" {
		return GoogleIdentity{}, ErrInvalidGoogleToken
	}

	claims := &googleClaims{}
	token, err := jwt.ParseWithClaims(
		rawToken,
		claims,
		func(token *jwt.Token) (any, error) {
			kid, ok := token.Header["kid"].(string)
			if !ok || kid == "" {
				return nil, ErrInvalidGoogleToken
			}
			key, err := v.keys.key(ctx, kid)
			if err != nil {
				return nil, err
			}
			return key, nil
		},
		jwt.WithValidMethods([]string{jwt.SigningMethodRS256.Alg()}),
		jwt.WithExpirationRequired(),
	)
	if err != nil || !token.Valid {
		if errors.Is(err, ErrGoogleUnavailable) {
			return GoogleIdentity{}, err
		}
		return GoogleIdentity{}, ErrInvalidGoogleToken
	}

	if claims.Issuer != "accounts.google.com" && claims.Issuer != "https://accounts.google.com" {
		return GoogleIdentity{}, ErrInvalidGoogleToken
	}
	if !v.allowsAudience(claims.Audience) {
		return GoogleIdentity{}, ErrInvalidGoogleToken
	}
	if claims.Subject == "" || claims.Email == "" || !claims.EmailVerified {
		return GoogleIdentity{}, ErrInvalidGoogleToken
	}

	givenName := strings.TrimSpace(claims.GivenName)
	familyName := strings.TrimSpace(claims.FamilyName)
	if givenName == "" {
		nameParts := strings.Fields(claims.Name)
		if len(nameParts) > 0 {
			givenName = nameParts[0]
			if len(nameParts) > 1 && familyName == "" {
				familyName = strings.Join(nameParts[1:], " ")
			}
		}
	}
	if givenName == "" {
		givenName = strings.Split(claims.Email, "@")[0]
	}

	return GoogleIdentity{
		UserID:     uuid.NewString(),
		Subject:    claims.Subject,
		Email:      normalizeEmail(claims.Email),
		GivenName:  givenName,
		FamilyName: familyName,
		AvatarURL:  claims.Picture,
	}, nil
}

func (v *GoogleVerifier) allowsAudience(audiences []string) bool {
	for _, audience := range audiences {
		if _, allowed := v.clientIDs[audience]; allowed {
			return true
		}
	}
	return false
}

type googleKeySet struct {
	client *http.Client
	url    string

	mu        sync.RWMutex
	keys      map[string]*rsa.PublicKey
	expiresAt time.Time
}

type jsonWebKeySet struct {
	Keys []jsonWebKey `json:"keys"`
}

type jsonWebKey struct {
	KeyType   string `json:"kty"`
	KeyID     string `json:"kid"`
	Algorithm string `json:"alg"`
	Modulus   string `json:"n"`
	Exponent  string `json:"e"`
}

func (s *googleKeySet) key(ctx context.Context, kid string) (*rsa.PublicKey, error) {
	s.mu.RLock()
	key, found := s.keys[kid]
	fresh := time.Now().Before(s.expiresAt)
	s.mu.RUnlock()
	if found && fresh {
		return key, nil
	}

	if err := s.refresh(ctx); err != nil {
		return nil, err
	}

	s.mu.RLock()
	key, found = s.keys[kid]
	s.mu.RUnlock()
	if !found {
		return nil, ErrInvalidGoogleToken
	}

	return key, nil
}

func (s *googleKeySet) refresh(ctx context.Context) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, s.url, nil)
	if err != nil {
		return fmt.Errorf("%w: create JWKS request: %v", ErrGoogleUnavailable, err)
	}

	response, err := s.client.Do(req)
	if err != nil {
		return fmt.Errorf("%w: fetch JWKS: %v", ErrGoogleUnavailable, err)
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		return fmt.Errorf("%w: JWKS returned %s", ErrGoogleUnavailable, response.Status)
	}

	var payload jsonWebKeySet
	if err := json.NewDecoder(response.Body).Decode(&payload); err != nil {
		return fmt.Errorf("%w: decode JWKS: %v", ErrGoogleUnavailable, err)
	}

	keys := make(map[string]*rsa.PublicKey, len(payload.Keys))
	for _, jwk := range payload.Keys {
		if jwk.KeyType != "RSA" || jwk.Algorithm != "RS256" || jwk.KeyID == "" {
			continue
		}
		key, err := parseRSAKey(jwk)
		if err != nil {
			continue
		}
		keys[jwk.KeyID] = key
	}
	if len(keys) == 0 {
		return fmt.Errorf("%w: JWKS contained no supported keys", ErrGoogleUnavailable)
	}

	s.mu.Lock()
	s.keys = keys
	s.expiresAt = time.Now().Add(cacheDuration(response.Header.Get("Cache-Control")))
	s.mu.Unlock()

	return nil
}

func parseRSAKey(jwk jsonWebKey) (*rsa.PublicKey, error) {
	modulus, err := base64.RawURLEncoding.DecodeString(jwk.Modulus)
	if err != nil {
		return nil, err
	}
	exponentBytes, err := base64.RawURLEncoding.DecodeString(jwk.Exponent)
	if err != nil {
		return nil, err
	}

	exponent := new(big.Int).SetBytes(exponentBytes)
	if !exponent.IsInt64() || exponent.Int64() <= 0 {
		return nil, errors.New("invalid RSA exponent")
	}

	return &rsa.PublicKey{
		N: new(big.Int).SetBytes(modulus),
		E: int(exponent.Int64()),
	}, nil
}

func cacheDuration(cacheControl string) time.Duration {
	for _, directive := range strings.Split(cacheControl, ",") {
		name, value, found := strings.Cut(strings.TrimSpace(directive), "=")
		if found && strings.EqualFold(name, "max-age") {
			seconds, err := strconv.Atoi(strings.Trim(value, "\""))
			if err == nil && seconds > 0 {
				return time.Duration(seconds) * time.Second
			}
		}
	}
	return time.Hour
}
