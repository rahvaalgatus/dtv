/** @jsx Jsx */
var Jsx = require("j6pack")
var Page = require("root/views/page")
var Paths = require("root/lib/paths")
var {SchoolPage} = require("../../read_page")
var {SchoolHeader} = require("../../read_page")
var {SchoolButton} = require("../../read_page")
var {Section} = Page
var {Form} = Page
exports = module.exports = CreatePage
exports.IdeaForm = IdeaForm

function CreatePage({req, t, school, budget}) {
	var {account} = req

	return <SchoolPage
		page="create-idea"
		req={req}
		title={t("create_idea_page.title")}
		school={school}
	>
		<SchoolHeader school={school}>
			<a href={Paths.schoolPath(school)} class="context">{school.name}</a>
			{" — "}
			<a href={Paths.budgetPath(school, budget)} class="context">
				{budget.title}
			</a>

			<h1>{t("create_idea_page.title")}</h1>
		</SchoolHeader>

		<Section>
			<IdeaForm
				req={req}
				t={t}
				action={req.baseUrl}
				school={school}
				idea={{author_names: account.name}}
				submit={t("create_idea_page.form.create_button")}
			/>
		</Section>
	</SchoolPage>
}

function IdeaForm({req, t, school, idea, action, method, submit}) {
	var ideaPath = req.baseUrl + "/" + idea.id

	return <Form
		action={action}
		req={req}
		method={method}
		id="idea-form"
		class="budget-form"
		enctype="multipart/form-data"
	>
		<label for="title" class="budget-field">
			<span class="label">{t("create_idea_page.form.title_label")}</span>

			<input
				type="text"
				name="title"
				required
				class="budget-input"
				value={idea.title}
			/>
		</label>

		<label class="budget-field">
			<span class="label">{t("create_idea_page.form.description_label")}</span>

			<textarea name="description" class="budget-input" required>
				{idea.description}
			</textarea>
		</label>

		<label for="image" class="budget-field">
			<span class="label">{t("create_idea_page.form.image_label")}</span>

			<p>
				{idea.image_type ? <img src={ideaPath + "/image"} /> : null}
				{t("create_idea_page.form.image_description")}
			</p>

			<input
				type="file"
				name="image"
				accept="image/jpeg, image/png, image/gif"
			/>
		</label>

		<label for="author_names" class="budget-field">
			<span class="label">{t("create_idea_page.form.author_names_label")}</span>
			<input
				name="author_names"
				class="budget-input"
				required
				value={idea.author_names}
			/>
		</label>

		<SchoolButton school={school} type="submit">{submit}</SchoolButton>
	</Form>
}
