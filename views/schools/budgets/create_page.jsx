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

function CreatePage({req, t, school, budget, voters}) {
	return <SchoolPage
		title={t("create_budget_page.title")}
		page="create-budget"
		class="update-budget-page"
		req={req}
		school={school}
	>
		<SchoolHeader school={school}>
			<a href={Paths.schoolPath(school)} class="context">{school.name}</a>
			<h1>{t("create_budget_page.title")}</h1>
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

function BudgetForm({req, school, budget, voters}) {
	var {t} = req
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
			<span class="label">{t("create_budget_page.form.title_label")}</span>

			<input
				type="text"
				name="title"
				class="budget-input"
				required
				value={budget.title}
			/>
		</label>

		<label for="description" class="budget-field">
			<span class="label">
				{t("create_budget_page.form.description_label")}
			</span>

			<p>{t("create_budget_page.form.description_description")}</p>

			<textarea name="description" class="budget-input">
				{budget.description}
			</textarea>
		</label>

		<label for="voting_starts_on" class="budget-field">
			<span class="label">{t("create_budget_page.form.start_label")}</span>
			<p>{Jsx.html(t("create_budget_page.form.start_description"))}</p>

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
			<span class="label">{t("create_budget_page.form.end_label")}</span>
			<p>{Jsx.html(t("create_budget_page.form.end_description"))}</p>

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

		{/* The id on <label> is for linking from the paper-votes page. */}
		<label id="voters" for="voters" class="budget-field">
			<span class="label">{t("create_budget_page.form.voters_title")}</span>
			<p>{t("create_budget_page.form.voters_description")}</p>

			<textarea
				name="voters"
				class="budget-input"
				placeholder={t("create_budget_page.form.voters_placeholder")}
			>
				{voters.map((voter) => voter.personal_id).join("\n")}
			</textarea>

			{voters.length > 0 ? <table
				id="voters"
				class="budget-table with-footer"
			>
				<thead>
					<tr>
						<th>{t("create_budget_page.voters.personal_id_column")}</th>
						<th>{t("create_budget_page.voters.name_column")}</th>

						<th class="voted-column">
							{t("create_budget_page.voters.voted_column")}
						</th>
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

						<td class="voted-column">{t("create_budget_page.voters.total", {
							votedCount: votedCounts.true || 0,
							unvotedCount: votedCounts.false || 0
						})}</td>
					</tr>
				</tfoot>
			</table> : null}
		</label>

		<SchoolButton school={school} type="submit">{budget.id
			? t("create_budget_page.form.update_button")
			: t("create_budget_page.form.create_button")
		}</SchoolButton>
	</Form>
}
