import { onRequestPost as __email_verification__action__js_onRequestPost } from "/Users/tang/Downloads/odo-studio/apps/booking-web/functions/email-verification/[action].js"

export const routes = [
    {
      routePath: "/email-verification/:action",
      mountPath: "/email-verification",
      method: "POST",
      middlewares: [],
      modules: [__email_verification__action__js_onRequestPost],
    },
  ]