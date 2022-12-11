/** @jsx Jsx */
var _ = require("root/lib/underscore")
var Jsx = require("j6pack")
var Page = require("../../page")
var Paths = require("root/lib/paths")
var {SchoolPage} = require("../read_page")
var {SchoolHeader} = require("../read_page")
var {SchoolButton} = require("../read_page")
var {Section} = Page
var {Heading} = Page
var {Form} = Page

module.exports = function(attrs) {
	var {req} = attrs
	var {school} = attrs
	var {ideas} = attrs
	var {paperVotes} = attrs

	return <SchoolPage
		page="paper-votes"
		req={attrs.req}
		school={school}
	>
		<SchoolHeader school={school}>
			<a href={Paths.schoolPath(school)} class="context">{school.name}</a>
			<h1>Paberhääled</h1>
		</SchoolHeader>

		<Section>
			<Heading>Ideed</Heading>

			{!_.isEmpty(ideas) ? <table id="ideas" class="budget-table">
				<thead>
					<tr>
						<th>Id</th>
						<th>Pealkiri</th>
					</tr>
				</thead>

				<tbody>{_.map(ideas, function(idea) {
					var ideaPath = Paths.ideaPath(school, idea)

					return <tr>
						<td>{idea.id}</td>
						<td>
							<a href={ideaPath} class="link-button">{idea.title}</a>
						</td>
					</tr>
				})}</tbody>
			</table> : null}
		</Section>

		<Section>
			<Heading>Paberhääled</Heading>

			<p class="section-paragraph">
				Paberhääled trumpavad üle digihääled.
			</p>

			<table id="paper-votes" class="budget-table">
				{paperVotes.length > 0 ? <thead>
					<th>Isikukood</th>
					<th>Idee id</th>
					<th>Idee pealkiri</th>
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
							Muuda paberhääli
						</label>

						<Form
							req={req}
							method="put"
							action={Paths.paperVotesPath(school)}
						>
							<p>
								Paberhääli saad lisada CSV (komaga eraldatud) formaadis, kus
								esimeses tulbas on hääletaja isikukood ja teises idee
								identifikaator. Hääletajad peavad olema
								eelnevalt lisatud <a href={Paths.editSchoolPath(school) + "#voters"}
								class="link-button">lubatud hääletajate nimekirja</a>.
							</p>

							<textarea
								name="paper-votes"
								class="budget-input"
								placeholder="Valija isikukood, idee id"
							>
								{paperVotes.map((vote) => (
									vote.voter_personal_id + ", " + vote.idea_id
								)).join("\n")}
							</textarea>

							<SchoolButton school={school} type="submit">
								Muuda paberhääli
							</SchoolButton>
						</Form>
					</td>
				</tr>
			</table>
		</Section>
	</SchoolPage>
}
