/** @jsx Jsx */
var Jsx = require("j6pack")
var Page = require("../page")
var Paths = require("root/lib/paths")
var {Header} = Page
var {Section} = Page
var {SchoolButton} = require("./read_page")
var {Form} = Page
var {isAdmin} = require("root/lib/account")
exports = module.exports = CreatePage
exports.SchoolForm = SchoolForm

function CreatePage({req, t}) {
	return <Page
		page="create-school"
		class="update-school-page"
		req={req}
		title={t("create_school_page.title")}
	>
		<Header>
			<h1>{t("create_school_page.title")}</h1>
		</Header>

		<Section>
			<SchoolForm req={req} school={{}} teachers={[]} />
		</Section>
	</Page>
}

function SchoolForm({req, school, teachers}) {
	var {t} = req
	var {account} = req

	return <Form
		action={school.id ? Paths.schoolPath(school) : Paths.schoolsPath}
		req={req}
		method={school.id ? "put" : "post"}
		enctype="multipart/form-data"
		id="school-form"
		class="budget-form"
	>
		<label for="name" class="budget-field">
			<span class="label">{t("create_school_page.form.name_label")}</span>

			<input
				type="text"
				name="name"
				class="budget-input"
				required
				value={school.name}
			/>
		</label>

		{isAdmin(account) ? <label for="slug" class="budget-field">
			<span class="label">{t("create_school_page.form.slug_label")}</span>
			<p>{t("create_school_page.form.slug_description")}</p>

			<input
				type="text"
				name="slug"
				class="budget-input"
				pattern="[-_\wäöüõ]+"
				value={school.slug}
				required
			/>
		</label> : null}

		<label for="description" class="budget-field">
			<span class="label">
				{t("create_school_page.form.description_label")}
			</span>

			<textarea name="description" class="budget-input">
				{school.description}
			</textarea>
		</label>

		<label for="colors" class="budget-field">
			<span class="label">{t("create_school_page.form.colors_label")}</span>
			<p>{Jsx.html(t("create_school_page.form.colors_description"))}</p>

			<table class="budget-table"><tbody>
				<tr>
					<td>{t("create_school_page.form.colors_bg")}</td>
					<td>
						<input
							name="background_color"
							type="color"
							class="budget-input"
							value={school.background_color || "#000001"}
						/>
					</td>
				</tr>

				<tr>
					<td>{t("create_school_page.form.colors_fg")}</td>
					<td>
						<input
							name="foreground_color"
							type="color"
							class="budget-input"
							value={school.foreground_color || "#000001"}
						/>
					</td>
				</tr>
			</tbody></table>
		</label>

		<label for="logo" class="budget-field">
			<span class="label">{t("create_school_page.form.logo_label")}</span>

			<p>
				{school.logo_type ?
					<img src={Paths.schoolPath(school) + "/logo"} />
				: null}

				{t("create_school_page.form.logo_description")}
			</p>

			<input
				type="file"
				name="logo"
				accept="image/jpeg, image/png, image/gif"
			/>
		</label>

		{isAdmin(account) ? <label for="teachers" class="budget-field">
			<span class="label">{t("create_school_page.form.teachers_label")}</span>
			<p>{t("create_school_page.form.teachers_description")}</p>

			<textarea
				name="teachers"
				class="budget-input"
				placeholder={t("create_school_page.form.teachers_placeholder")}
			>
				{teachers.map((teacher) => teacher.personal_id).join("\n")}
			</textarea>
		</label> : null}

		{school.id ? <SchoolButton school={school} type="submit">
			{t("create_school_page.form.update_button")}
		</SchoolButton> : <button class="blue-button" type="submit">
			{t("create_school_page.form.create_button")}
		</button>}
	</Form>
}
