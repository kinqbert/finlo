package auth

import (
	"net/http"
	"testing"
)

func TestRefreshCookieSecurityAttributes(t *testing.T) {
	cookie := refreshCookie("refresh-token", CookieOptions{
		Domain:   "example.com",
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
	})

	if cookie.Name != refreshCookieName || cookie.Value != "refresh-token" {
		t.Fatalf("refreshCookie() identity = %q:%q", cookie.Name, cookie.Value)
	}
	if !cookie.HttpOnly || !cookie.Secure || cookie.SameSite != http.SameSiteStrictMode {
		t.Fatalf("refreshCookie() missing security attributes: %#v", cookie)
	}
	if cookie.Path != "/auth" || cookie.Domain != "example.com" || cookie.MaxAge <= 0 {
		t.Fatalf("refreshCookie() scope or lifetime is invalid: %#v", cookie)
	}
}

func TestExpiredRefreshCookieDeletesCookie(t *testing.T) {
	cookie := expiredRefreshCookie(CookieOptions{Secure: true, SameSite: http.SameSiteLaxMode})
	if cookie.Value != "" || cookie.MaxAge != -1 || cookie.Expires.IsZero() {
		t.Fatalf("expiredRefreshCookie() = %#v", cookie)
	}
}
