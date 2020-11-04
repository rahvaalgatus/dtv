describe("Web", function() {
	require("root/test/web")()

	describe("/", function() {
		it("must redirect to /schools", function*() {
			var res = yield this.request("/")
			res.statusCode.must.equal(302)
			res.headers.location.must.equal("/schools")
		})
	})

	describe("/schools", function() {
		it("must render", function*() {
			var res = yield this.request("/schools")
			res.statusCode.must.equal(200)
		})
	})
})
