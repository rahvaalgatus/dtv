/** @jsx Jsx */
var _ = require("root/lib/underscore")
var Jsx = require("j6pack")
var Page = require("root/views/page")
var Paths = require("root/lib/paths")
var {SchoolPage} = require("../../read_page")
var {SchoolHeader} = require("../../read_page")
var {SchoolButton} = require("../../read_page")
var {Section} = Page
var {Heading} = Page
var {Form} = Page

module.exports = function({req, t, school, budget, ideas, paperVotes}) {
	return <SchoolPage
		title={t("paper_votes_page.title", {title: budget.title})}
		page="paper-votes"
		req={req}
		school={school}
	>
		<SchoolHeader school={school}>
			<a href={Paths.schoolPath(school)} class="context">{school.name}</a>

			<h1>{Jsx.html(t("paper_votes_page.title", {
				title: <a href={Paths.budgetPath(school, budget)}>{budget.title}</a>
			}))}</h1>
		</SchoolHeader>

		<Section>
			<Heading>{t("paper_votes_page.ideas.title")}</Heading>

			{!_.isEmpty(ideas) ? <table id="ideas" class="budget-table">
				<thead>
					<tr>
						<th>{t("paper_votes_page.ideas.id_column")}</th>
						<th>{t("paper_votes_page.ideas.title_column")}</th>
					</tr>
				</thead>

				<tbody>{_.map(ideas, function(idea) {
					var ideaPath = Paths.ideaPath(school, idea)

					return <tr>
						<td>{idea.id}</td>
						<td><a href={ideaPath} class="link-button">{idea.title}</a></td>
					</tr>
				})}</tbody>
			</table> : null}
		</Section>

		<Section>
			<Heading>{t("paper_votes_page.votes.title")}</Heading>

			<p class="section-paragraph">{t("paper_votes_page.votes.description")}</p>

			<table id="paper-votes" class="budget-table">
				{paperVotes.length > 0 ? <thead>
					<th>{t("paper_votes_page.votes.personal_id_column")}</th>
					<th>{t("paper_votes_page.votes.id_column")}</th>
					<th>{t("paper_votes_page.votes.title_column")}</th>
				</thead> : null}

				{paperVotes.map(function(vote) {
					return <tr class="vote">
						<td>{vote.voter_personal_id}</td>
						<td>{vote.idea_id}</td>
						<td>{ideas[vote.idea_id].title}</td>
					</tr>
				})}

				<tr class="edit-row">
					<td colspan="3">
						<input
							type="checkbox"
							id="edit-paper-votes-toggle"
							hidden
							checked={paperVotes.length == 0}
						/>

						<label for="edit-paper-votes-toggle" class="edit-button">
							{t("paper_votes_page.votes.edit_button")}
						</label>

						<Form
							req={req}
							method="put"
							action={Paths.paperVotesPath(school, budget)}
						>
							<p>{Jsx.html(t("paper_votes_page.votes.csv_description", {
								votersUrl: Paths.updateSchoolPath(school) + "#voters"
							}))}</p>

							<textarea
								name="paper-votes"
								class="budget-input"
								placeholder={t("paper_votes_page.votes.csv_placeholder")}
							>{paperVotes.map((vote) => (
								vote.voter_personal_id + ", " + vote.idea_id
							)).join("\n")}</textarea>

							<SchoolButton school={school} type="submit">
								{t("paper_votes_page.votes.edit_button")}
							</SchoolButton>
						</Form>
					</td>
				</tr>
			</table>
		</Section>
	</SchoolPage>
}
