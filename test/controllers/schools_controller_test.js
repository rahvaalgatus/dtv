describe("SchoolsController", function() {
	require("root/test/web")()
	require("root/test/db")()

	describe("/", function() {
		it("must redirect to /", function*() {
			var res = yield this.request("/schools")
			res.statusCode.must.equal(302)
			res.headers.location.must.equal("/")
		})
	})
})
