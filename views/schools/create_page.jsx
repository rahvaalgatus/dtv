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

function CreatePage(attrs) {
	var {req} = attrs

	return <Page
		page="create-school"
		class="update-school-page"
		req={attrs.req}
		title="Uus kool"
	>
		<Header>
			<h1>Uus kool</h1>
		</Header>

		<Section>
			<SchoolForm req={req} school={{}} teachers={[]} />
		</Section>
	</Page>
}

function SchoolForm(attrs) {
	var {req} = attrs
	var {account} = req
	var {school} = attrs
	var {teachers} = attrs

	return <Form
		action={school.id ? Paths.schoolPath(school) : Paths.schoolsPath}
		req={req}
		method={school.id ? "put" : "post"}
		enctype="multipart/form-data"
		id="school-form"
		class="budget-form"
	>
		<label for="name" class="budget-field">
			<span class="label">Kooli nimi</span>

			<input
				type="text"
				name="name"
				class="budget-input"
				required
				value={school.name}
			/>
		</label>

		{isAdmin(account) ? <label for="slug" class="budget-field">
			<span class="label">Kooli nimi veebiaadresside jaoks</span>
			<p>Lubatud vaid väikesed tähed ning "_" ja "-" märgid.</p>

			<input
				type="text"
				name="slug"
				class="budget-input"
				pattern="[-_\w]+"
				value={school.slug}
				required
			/>
		</label> : null}

		<label for="description" class="budget-field">
			<span class="label">Kooli kirjeldus</span>

			<textarea name="description" class="budget-input">
				{school.description}
			</textarea>
		</label>

		<label for="colors" class="budget-field">
			<span class="label">Värvid</span>

			<p>
				Värve kasutatakse lehe päise, jaluse ja nuppude jaoks. Vali värv
				värvikaardilt või selle puudumisel sisesta värvid RGB formaadis
				(#aabbcc). Sisutekst on aga alati mustas kirjas valgel taustal.
			</p>

			<table class="budget-table"><tbody>
				<tr>
					<td>Taustavärv</td>
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
					<td>Tekstivärv</td>
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
			<span class="label">Logo</span>

			<p>
				{school.logo_type ?
					<img src={Paths.schoolPath(school) + "/logo"} />
				: null}

				JPEG, PNG või GIF formaadis pilt suurusega kuni 5 MiB.
			</p>

			<input
				type="file"
				name="logo"
				accept="image/jpeg, image/png, image/gif"
			/>
		</label>

		{isAdmin(account) ? <label for="teachers" class="budget-field">
			<span class="label">Õpetajate isikukoodid</span>
			<p>Eralda isikukoodid reavahedega.</p>

			<textarea
				name="teachers"
				class="budget-input"
				placeholder="Õpetajate isikukoodid"
			>
				{teachers.map((teacher) => teacher.personal_id).join("\n")}
			</textarea>
		</label> : null}

		{school.id
			? <SchoolButton school={school} type="submit">Muuda</SchoolButton>
			: <button class="blue-button" type="submit">Lisa uus kool</button>
		}
	</Form>
}
