/* ==========================================================================
   Sara & Ben — Wedding Plan Site
   Cross-device sync config for the Family Portrait List checklist.

   This lets Sara & Ben's two coordinators check things off on separate
   phones and see each other's progress. It uses jsonbin.io, a free
   service for storing a small piece of shared data. Setup (~2 minutes,
   one time only):

   1. Go to https://jsonbin.io and create a free account.
   2. Click "Create Bin". Paste this as the starting content: {"status": "ready"}
   3. Save it, then copy the Bin ID shown in the URL/dashboard
      (looks like "6567abstartingxyz...").
   4. Go to Account > API Keys and copy your "X-Access-Key".
   5. Paste both values below, between the quotes.

   Until both values are filled in, the checklist still works — it just
   saves privately to each device instead of syncing between them.
   ========================================================================== */

var SYNC_CONFIG = {
  binId: "6a7d2712da38895dfedd651b",
  apiKey: "$2a$10$X9g2AcdEok6ly3hetI4Z9.mb8H98D80Mr90s3vQzukQWJiI1GgEBO"
};
