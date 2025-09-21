const actions = [
  // User
  "user:read",
  "user:create",
  "user:update",
  "user:updateSelf",
  "user:delete",
  "user:deleteSelf",

  // Organisation
  "organisation:read",
  "organisation:create",
  "organisation:update",
  "organisation:updateSelf",
  "organisation:delete",

  // Event
  "event:read",
  "event:create",
  "event:update",
  "event:updateSelf",
  "event:delete",
  "event:deleteSelf",

  // Sponsor
  "sponsor:read",
  "sponsor:create",
  "sponsor:update",
  "sponsor:delete",

  // Announcement
  "announcement:read",
  "announcement:create",
  "announcement:delete",
  "announcement:deleteSelf",

  // Entry Pass
  "entryPass:read",
  "entryPass:purchase",
  "entryPass:checkIn",

  // Location
  "marker:create",
  "marker:read",
  "marker:update",
  "marker:updateSelf",
  "marker:delete",
  "marker:deleteSelf",

  // Payment
  "payment:read",
  "payment:readSelf",
  "payment:verify",

  // Permissions
  "permissions:read",
  "permissions:update",

  // Feature Flags
  "features:read",
  "features:toggle",

  // Banners
  "banners:read",
  "banners:create",
  "banners:update",
  "banners:delete",

  // Notification
  "notification:send",

  // Promotion Campaigns
  "promotionCampaign:read",
  "promotionCampaign:create",
  "promotionCampaign:update",

  // Rewards
  "reward:read",
];

const defaultAdminPerms = actions; // Admin has all permissions

// will be populated by the database
// at the start of the application
const permissions = {
  admin: defaultAdminPerms,
  organiser: [
    "event:read",
    "event:create",
    "event:update",
    "event:updateSelf",
    "event:delete",
    "event:deleteSelf",
    "organisation:read",
    "organisation:updateSelf",
    "announcement:read",
    "announcement:create",
    "announcement:delete",
    "announcement:deleteSelf",
    "notification:send",
    "entryPass:read",
    "entryPass:checkIn",
  ],
  user: [
    "event:read",
    "user:updateSelf",
    "entryPass:read",
    "entryPass:purchase",
    "payment:readSelf",
  ],
  guest: [
    "event:read",
  ],
  paymentVerifier: [
    "payment:read",
    "payment:verify",
  ],
};

module.exports = {
  actions,
  permissions,
};
