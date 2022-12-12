/** @jsx Jsx */
var _ = require("root/lib/underscore")
var Jsx = require("j6pack")
var Page = require("../../page")
var Paths = require("root/lib/paths")
var {SchoolPage} = require("../read_page")
var {SchoolHeader} = require("../read_page")
var {Section} = Page
var {SchoolButton} = require("../read_page")
var DateFns = require("date-fns")
var {Form} = Page
exports = module.exports = CreatePage
exports.BudgetForm = BudgetForm

function CreatePage(attrs) {
	var {req} = attrs
	var {school} = attrs
	var {budget} = attrs
	var {voters} = attrs

	return <SchoolPage
		page="create-budget"
		class="update-budget-page"
		req={attrs.req}
		school={school}
	>
		<SchoolHeader school={school}>
			<a href={Paths.schoolPath(school)} class="context">{school.name}</a>
			<h1>Uus eelarve hääletus</h1>
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

function BudgetForm(attrs) {
	var {req} = attrs
	var {school} = attrs
	var {budget} = attrs
	var {voters} = attrs
	var votedCounts = _.countBy(voters, "has_voted")

	var path = budget.id
		? Paths.budgetPath(school, budget)
		: Paths.budgetsPath(school)

	return <Form
		action={path}
		req={req}
		method={budget.id ? "put" : "post"}
		id="budget-form"
		class="budget-form"
	>
		<label for="title" class="budget-field">
			<span class="label">Eelarve hääletuse pealkiri</span>

			<input
				type="text"
				name="title"
				class="budget-input"
				required
				value={budget.title}
			/>
		</label>

		<label for="description" class="budget-field">
			<span class="label">Sissejuhatav tekst</span>

			<p>
				Sissejuhatavat teksti kuvatakse sõltumata, kas hääletus on alanud
				või lõppenud.
			</p>

			<textarea name="description" class="budget-input">
				{budget.description}
			</textarea>
		</label>

		<label for="voting_starts_on" class="budget-field">
			<span class="label">Hääletamise algus</span>

			<p>
				Ideid saab lisada ja muuta kuni hääletamise alguseni.<br />
				Vali kuupäev kalendrist või selle puudumisel sisesta see formaadis <code>2021-01-31</code>.
			</p>

			<input
				name="voting_starts_on"
				type="date"
				class="budget-input"

				value={
					budget.voting_starts_at &&
					_.formatDate("iso", budget.voting_starts_at)
				}
			/>
		</label>

		<label for="voting_ends_on" class="budget-field">
			<span class="label">Hääletamise lõpp</span>

			<p>
				Hääletada saab südaööni ehk kl 23:59ni.<br />
				Vali kuupäev kalendrist või selle puudumisel sisesta see formaadis <code>2021-01-31</code>.
			</p>

			<input
				name="voting_ends_on"
				type="date"
				class="budget-input"

				value={
					budget.voting_ends_at &&
					_.formatDate("iso", DateFns.addSeconds(budget.voting_ends_at, -1))
				}
			/>
		</label>

		{/* The id is for linking from the paper-votes page. */}
		<label id="voters" for="voters" class="budget-field">
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
				placeholder="Ideede esitajate ja hääletajate isikukoodid"
			>
				{voters.map((voter) => voter.personal_id).join("\n")}
			</textarea>

			{voters.length > 0 ? <table
				id="voters"
				class="budget-table with-footer"
			>
				<thead>
					<tr>
						<th>Isikukood</th>
						<th>Nimi</th>
						<th class="voted-column">Hääletanud</th>
					</tr>
				</thead>

				<tbody>{voters.map(function(voter) {
					return <tr>
						<td>{voter.personal_id}</td>
						<td>{voter.name}</td>
						<td class="voted-column">{voter.has_voted ? "✅" : ""}</td>
					</tr>
				})}</tbody>

				<tfoot>
					<tr>
						<td colspan="2" />

						<td class="voted-column">
							Hääletanud on {votedCounts.true || 0}.<br />
							Hääletamata veel {votedCounts.false || 0}.
						</td>
					</tr>
				</tfoot>
			</table> : null}
		</label>

		<SchoolButton school={school} type="submit">
			{budget.id ? "Muuda hääletust" : "Lisa uus eelarve hääletus"}
		</SchoolButton>
	</Form>
}
