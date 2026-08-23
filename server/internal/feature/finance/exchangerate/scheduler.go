package exchangerate

import (
	"context"
	"time"
)

const refreshInterval = 24 * time.Hour

func StartScheduler(parent context.Context, service *Service, report func(error)) context.CancelFunc {
	ctx, cancel := context.WithCancel(parent)
	go func() {
		refresh := func() {
			requestCtx, requestCancel := context.WithTimeout(ctx, 20*time.Second)
			defer requestCancel()
			if err := service.Refresh(requestCtx); err != nil && ctx.Err() == nil {
				report(err)
			}
		}
		refresh()
		ticker := time.NewTicker(refreshInterval)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				refresh()
			}
		}
	}()
	return cancel
}
