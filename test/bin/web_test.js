describe("Web", function() {
	require("root/test/web")()

	describe("/non-existent", function() {
		it("must render 404 error page", function*() {
			var res = yield this.request("/non-existent")
			res.statusCode.must.equal(404)
			res.headers["content-type"].must.equal("text/html; charset=utf-8")
		})
	})
})
