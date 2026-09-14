import { request } from '@playwright/test';

// The image ships an empty HSQLDB schema: until it's created, registration can't
// allocate ids and any page reading a parameter returns 500. Runs here rather than
// as a CI step so local and CI runs are prepared identically - a hand-initialised
// local container once hid exactly that difference.
export default async function globalSetup() {
  const baseURL = process.env.BASE_URL ?? 'http://localhost:8080';
  const context = await request.newContext({ baseURL });

  try {
    // Not db.htm (the admin Initialize button): its @ModelAttribute reads the
    // Parameter table first, so it 500s on an empty schema.
    await context.get('/parabank/initializeDB.htm');

    // initializeDB.htm redirects home whether or not it worked; admin.htm reads
    // Parameter, so a 200 there proves the schema exists.
    const verification = await context.get('/parabank/admin.htm');
    if (!verification.ok()) {
      throw new Error(
        `ParaBank schema was not created: GET /parabank/admin.htm returned ${verification.status()}. ` +
        `Check that the container is running and reachable at ${baseURL}.`,
      );
    }
  } finally {
    await context.dispose();
  }
}
