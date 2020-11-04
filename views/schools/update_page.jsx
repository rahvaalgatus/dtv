/** @jsx Jsx */
var _ = require("root/lib/underscore")
var Jsx = require("j6pack")
var Page = require("../page")
var DateFns = require("date-fns")
var {Header} = Page
var {Section} = Page
var {Heading} = Page
var {Form} = Page

module.exports = function(attrs) {
	var {req} = attrs
	var {school} = attrs
	var {teachers} = attrs
	var {voters} = attrs
	var schoolPath = req.baseUrl + "/" + school.id

	return <Page
		page="update-school"
		req={attrs.req}
		title={school.name}
	>
		<Header>
			<h1>
				<a href={schoolPath}>{school.name}</a>
			</h1>
		</Header>

		<Section>
			<Form
				action={schoolPath}
				req={req}
				method="put"
				id="school-form"
				class="budget-form"
			>
				<label for="name" class="budget-field">
					<span class="label">Kooli nimi</span>

					<input
						type="text"
						name="name"
						class="budget-input"
						value={school.name}
					/>
				</label>

				<label for="description" class="budget-field">
					<span class="label">Sissejuhatav tekst</span>

					<p>
						Sissejuhatavat teksti kuvatakse sõltumata, kas hääletus on alanud
						või lõppenud.
					</p>

					<textarea name="description" class="budget-input">
						{school.description}
					</textarea>
				</label>

				<label for="voting_starts_on" class="budget-field">
					<span class="label">Hääletamise algus</span>

					<p>
						Ideid saab lisada ja muuta kuni hääletamise alguseni.
					</p>

					<input
						name="voting_starts_on"
						type="date"
						class="budget-input"

						value={
							school.voting_starts_at &&
							_.formatDate("iso", school.voting_starts_at)
						}
					/>
				</label>

				<label for="voting_ends_on" class="budget-field">
					<span class="label">Hääletamise lõpp</span>

					<p>
						Hääletada saab südaööni.
					</p>

					<input
						name="voting_ends_on"
						type="date"
						class="budget-input"

						value={
							school.voting_ends_at &&
							_.formatDate("iso", DateFns.addSeconds(school.voting_ends_at, -1))
						}
					/>
				</label>

				<label for="voters" class="budget-field">
					<span class="label">Ideede esitajad ja hääletajad</span>

					<p>
						Kõik hääletajad saavad pakkuda välja ka uusi ideid. Kõik ülejäänud
						küll näevad ideid ja hääletust, kuid osaleda ei saa.
						Õpetajad saavad alati ideid lisada ja hääletada.
						<br />
						Eralda isikukoodid reavahedega.
					</p>

					<textarea
						name="voters"
						class="budget-input"
						pla60001019906ceholder="Ideede esitajate ja hääletajate isikukoodid"
					>
						{voters.map((voter) => voter.personal_id).join("\n")}
					</textarea>

					{voters.length > 0 ? <table id="voters" class="budget-table">
						<thead>
							<tr>
								<th>Isikukood</th>
								<th>Nimi</th>
							</tr>
						</thead>

						<tbody>{voters.map(function(voter) {
							return <tr>
								<td>{voter.personal_id}</td>
								<td>{voter.name}</td>
							</tr>
						})}</tbody>
					</table> : null}
				</label>

				<button type="submit">Muuda</button>
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
	</Page>
}
