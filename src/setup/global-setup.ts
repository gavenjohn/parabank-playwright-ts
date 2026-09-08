import { request } from '@playwright/test';

// The parasoft/parabank image ships with an empty HSQLDB schema: db.script in
// the container holds HSQLDB's own bootstrap and no application tables at all.
// Without Parameter and Sequence, registration cannot allocate a customer id
// and every page that reads a parameter returns 500.
//
// This runs as global setup rather than as a CI step so a local run and a CI
// run do the same thing. The bug this fixes was exactly that divergence: the
// local container had been initialised by hand on day one and kept the schema
// in its writable layer ever since, while CI built a fresh container each run.
export default async function globalSetup() {
  const baseURL = process.env.BASE_URL ?? 'http://localhost:8080';
  const context = await request.newContext({ baseURL });

  try {
    // Not db.htm, the admin page's Initialize button. That handler is preceded
    // by a Spring @ModelAttribute method that reads the Parameter table to
    // build the form, so on an empty schema it 500s before the INIT can run.
    // initializeDB.htm binds no form, so it has nothing to read first.
    await context.get('/parabank/initializeDB.htm');

    // Prove the tables exist instead of trusting the status: initializeDB.htm
    // redirects to the home page and would report success either way. admin.htm
    // is the page that reads Parameter, and it is the exact request that
    // returned 500 on a fresh container.
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
