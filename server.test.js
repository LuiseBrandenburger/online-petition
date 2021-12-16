const supertest = require("supertest");
const app = require("./server.js");
const cookieSession = require("cookie-session");

// test("Sanity Check", () => {
//     expect(1).toBe(2);
// });

// testing server routes
// SMOKE TESTS

test("Homepage functional", () => {
    // we need to trigger a http request
    return supertest(app).get("/").then((res) => {
        // console.log(res);
        expect(res.statusCode).toBe(200);
        expect(200) // more compact supertest expects statuscode
        .expect("Hello") // expects body;
        expect(req.body).toInclude("text");
    });

});

test("Check cookies", () => {

    cookieSession.mockSessinOnce({userId: 1,
        signatureId: 7}
    );
});