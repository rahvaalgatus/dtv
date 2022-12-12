/** @jsx Jsx */
var Jsx = require("j6pack")
var Page = require("../page")
var Paths = require("root/lib/paths")
var {SchoolPage} = require("./read_page")
var {SchoolHeader} = require("./read_page")
var {SchoolButton} = require("./read_page")
var {Section} = Page
var {Heading} = Page
var {Form} = Page

module.exports = function(attrs) {
	var {req} = attrs
	var {school} = attrs
	var {teachers} = attrs
	var schoolPath = Paths.schoolPath(school)

	return <SchoolPage
		page="update-school"
		req={attrs.req}
		school={school}
	>
		<SchoolHeader school={school}>
			<h1><a href={schoolPath}>{school.name}</a></h1>
		</SchoolHeader>

		<Section>
			<Form
				action={schoolPath}
				req={req}
				method="put"
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
						{school.logo_type ? <img src={schoolPath + "/logo"} /> : null}

						JPEG, PNG või GIF formaadis pilt suurusega kuni 5 MiB.
					</p>

					<input
						type="file"
						name="logo"
						accept="image/jpeg, image/png, image/gif"
					/>
				</label>

				<SchoolButton school={school} type="submit">Muuda</SchoolButton>
			</Form>
		</Section>

		<Section id="teachers-section">
			<Heading>Õpetajad</Heading>

			<p class="section-paragraph">
				Õpetajatel on õigus muuta kooli nime ja loetelu õpilastest, kes on
				lubatud esitama ideid või nende poolt hääletada. Õpetajad saavad ka
				alati lisada ideid. Õpetajate lisamiseks palun võta meiega ühendust.
			</p>

			<table id="teachers" class="budget-table">
				<thead>
					<tr>
						<th>Isikukood</th>
						<th>Nimi</th>
					</tr>
				</thead>

				<tbody>{teachers.map(function(teacher) {
					return <tr>
						<td>{teacher.personal_id}</td>
						<td>{teacher.name}</td>
					</tr>
				})}</tbody>
			</table>
		</Section>
	</SchoolPage>
}
