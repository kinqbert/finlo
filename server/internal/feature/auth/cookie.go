package auth

import (
	"net/http"
	"time"
)

const (
	refreshCookieName     = "finlo_refresh"
	tokenTransportHeader  = "X-Finlo-Token-Transport"
	cookieTokenTransport  = "cookie"
	refreshCookieLifetime = 30 * 24 * time.Hour
)

type CookieOptions struct {
	Domain   string
	Secure   bool
	SameSite http.SameSite
}

func refreshCookie(token string, options CookieOptions) *http.Cookie {
	return &http.Cookie{
		Name:     refreshCookieName,
		Value:    token,
		Path:     "/auth",
		Domain:   options.Domain,
		MaxAge:   int(refreshCookieLifetime.Seconds()),
		Expires:  time.Now().Add(refreshCookieLifetime),
		HttpOnly: true,
		Secure:   options.Secure,
		SameSite: options.SameSite,
	}
}

func expiredRefreshCookie(options CookieOptions) *http.Cookie {
	cookie := refreshCookie("", options)
	cookie.MaxAge = -1
	cookie.Expires = time.Unix(1, 0)
	return cookie
}
