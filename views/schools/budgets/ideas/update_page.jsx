/** @jsx Jsx */
var Jsx = require("j6pack")
var Page = require("root/views/page")
var Paths = require("root/lib/paths")
var {SchoolPage} = require("../../read_page")
var {SchoolHeader} = require("../../read_page")
var {Section} = Page
var {IdeaForm} = require("./create_page")

module.exports = function(attrs) {
	var {req} = attrs
	var {school} = attrs
	var {budget} = attrs
	var {idea} = attrs
	var ideaPath = req.baseUrl + "/" + idea.id

	return <SchoolPage
		page="update-idea"
		req={attrs.req}
		title={idea.title}
		school={school}
	>
		<SchoolHeader school={school}>
			<a href={Paths.schoolPath(school)} class="context">{school.name}</a>
			{" — "}
			<a href={Paths.budgetPath(school, budget)} class="context">
				{budget.title}
			</a>

			<h1><a href={ideaPath}>{idea.title}</a></h1>
		</SchoolHeader>

		<Section>
			<IdeaForm
				req={req}
				action={ideaPath}
				method="put"
				id="account-form"
				school={school}
				idea={idea}
				submit="Muuda ideed"
			/>
		</Section>
	</SchoolPage>
}
