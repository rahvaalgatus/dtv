/** @jsx Jsx */
var Jsx = require("j6pack")
var Page = require("../../page")
var Paths = require("root/lib/paths")
var {SchoolPage} = require("../read_page")
var {SchoolHeader} = require("../read_page")
var {Section} = Page
var {BudgetForm} = require("./create_page")
exports = module.exports = UpdatePage
exports.BudgetForm = BudgetForm

function UpdatePage(attrs) {
	var {req} = attrs
	var {school} = attrs
	var {budget} = attrs
	var {voters} = attrs

	return <SchoolPage
		page="update-budget"
		class="update-budget-page"
		req={attrs.req}
		school={school}
	>
		<SchoolHeader school={school}>
			<a href={Paths.schoolPath(school)} class="context">{school.name}</a>
			<h1>{budget.title}</h1>
		</SchoolHeader>

		<Section>
			<BudgetForm
				req={req}
				school={school}
				budget={budget}
				voters={voters}
			/>
		</Section>
	</SchoolPage>
}