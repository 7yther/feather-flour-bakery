declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    BAKERY_WORKSPACE_ID?: string;
    INITIAL_ADMIN_USERNAME?: string;
    INITIAL_ADMIN_PASSWORD_HASH?: string;
  }
}
