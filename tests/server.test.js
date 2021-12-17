const supertest = require("supertest");
const app = require("../server.js");
const cookieSession = require("cookie-session");


test("Check cookies", () => {
    cookieSession.mockSessinOnce({userId: 1,
        signatureId: 7}
    );
});

/*
TODO: Users who are logged out are redirected to the registration 
page when they attempt to go to the petition page

TODO: Users who are logged in are redirected to the petition page 
when they attempt to go to either the registration page or the login page

TODO: Users who are logged in and have signed the petition are redirected 
to the thank you page when they attempt to go to the petition page or 
submit a signature

TODO: Users who are logged in and have not signed the petition are 
redirected to the petition page when they attempt to go to either 
the thank you page or the signers page
 */

