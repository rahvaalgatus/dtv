/** @jsx Jsx */
var Jsx = require("j6pack")
var Page = require("../../page")
var {Header} = Page
var {Section} = Page
var {Form} = Page
exports = module.exports = CreatePage
exports.IdeaForm = IdeaForm

function CreatePage(attrs) {
	var {req} = attrs
	var {school} = attrs
	var {account} = req
	var schoolUrl = "/schools/" + school.id

	return <Page
		page="create-idea"
		req={attrs.req}
		title={"Uus idee - " + school.name}
	>
		<Header>
			<h1>Esita uus idee</h1>
			<a href={schoolUrl} class="subtitle">{school.name}</a>
		</Header>

		<Section>
			<IdeaForm
				action={req.baseUrl}
				req={req}
				idea={{author_names: account.name}}
				submit={"Esita uus idee"}
			/>
		</Section>
	</Page>
}

function IdeaForm(attrs) {
	var {req} = attrs
	var {idea} = attrs
	var {action} = attrs
	var {method} = attrs
	var {submit} = attrs

	return <Form
		action={action}
		req={req}
		method={method}
		id="idea-form"
		class="budget-form"
	>
		<label for="title" class="budget-field">
			<span class="label">Pealkiri</span>

			<input
				type="text"
				name="title"
				required
				class="budget-input"
				value={idea.title}
			/>
		</label>

		<label class="budget-field">
			<span class="label">Kirjeldus</span>
			<textarea name="description" class="budget-input" required>
				{idea.description}
			</textarea>
		</label>

		<label for="author_names" class="budget-field">
			<span class="label">Autorite nimed</span>
			<input
				name="author_names"
				class="budget-input"
				required
				value={idea.author_names}
			/>
		</label>

		<button type="submit">{submit}</button>
	</Form>
}
