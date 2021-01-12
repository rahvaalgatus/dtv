/** @jsx Jsx */
var Jsx = require("j6pack")
var Page = require("../../page")
var {Header} = Page
var {Section} = Page
var {IdeaForm} = require("./create_page")

module.exports = function(attrs) {
	var {req} = attrs
	var {school} = attrs
	var {idea} = attrs
	var schoolUrl = "/schools/" + school.id

	return <Page
		page="update-idea"
		req={attrs.req}
		title={idea.title + " - " + school.name}
	>
		<Header>
			<a href={schoolUrl} class="context">{school.name}</a>
			<h1>{idea.title}</h1>
		</Header>

		<Section>
			<IdeaForm
				req={req}
				action={req.baseUrl + "/" + idea.id}
				method="put"
				id="account-form"
				idea={idea}
				submit={"Muuda ideed"}
			/>
		</Section>
	</Page>
}
