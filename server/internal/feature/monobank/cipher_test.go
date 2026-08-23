package monobank

import (
	"encoding/base64"
	"strings"
	"testing"
)

func TestTokenCipherRoundTrip(t *testing.T) {
	t.Parallel()
	key := base64.StdEncoding.EncodeToString([]byte(strings.Repeat("k", 32)))
	cipher, err := newTokenCipher(key)
	if err != nil {
		t.Fatalf("newTokenCipher() error = %v", err)
	}
	encrypted, err := cipher.encrypt("personal-token")
	if err != nil {
		t.Fatalf("encrypt() error = %v", err)
	}
	if string(encrypted) == "personal-token" {
		t.Fatal("encrypt() returned plaintext")
	}
	decrypted, err := cipher.decrypt(encrypted)
	if err != nil {
		t.Fatalf("decrypt() error = %v", err)
	}
	if decrypted != "personal-token" {
		t.Fatalf("decrypt() = %q", decrypted)
	}
}

func TestTokenCipherConfiguration(t *testing.T) {
	t.Parallel()
	cipher, err := newTokenCipher("")
	if err != nil || cipher != nil {
		t.Fatalf("empty key = %#v, %v; want disabled cipher", cipher, err)
	}
	if _, err := newTokenCipher(base64.StdEncoding.EncodeToString([]byte("short"))); err == nil {
		t.Fatal("newTokenCipher() accepted a short key")
	}
}
