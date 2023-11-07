/** @jsx Jsx */
var Jsx = require("j6pack")
var Page = require("../../page")
var Paths = require("root/lib/paths")
var {SchoolPage} = require("../read_page")
var {SchoolHeader} = require("../read_page")
var {Section} = Page
var {BudgetForm} = require("./create_page")

module.exports = function({req, t, school, budget, voters}) {
	return <SchoolPage
		title={t("update_budget_page.title", {title: budget.title})}
		page="update-budget"
		class="update-budget-page"
		req={req}
		school={school}
	>
		<SchoolHeader school={school}>
			<a href={Paths.schoolPath(school)} class="context">{school.name}</a>
			<h1><a href={Paths.budgetPath(school, budget)}>{budget.title}</a></h1>
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
