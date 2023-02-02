/** @jsx Jsx */
var _ = require("root/lib/underscore")
var Jsx = require("j6pack")
var Page = require("../../page")
var DateFns = require("date-fns")
var Paths = require("root/lib/paths")
var {SchoolPage} = require("../read_page")
var {SchoolHeader} = require("../read_page")
var {SchoolButton} = require("../read_page")
var {Section} = Page
var {Heading} = Page
var {Form} = Page
var {DateElement} = Page
var {serializeStyle} = Page
var EidView = require("../../eid_view")
var linkify = require("root/lib/linkify")
exports = module.exports = ReadPage

function ReadPage(attrs) {
	var {req} = attrs
	var {roles} = req
	var {school} = attrs
	var {budget} = attrs
	var {ideas} = attrs
	var {votesByIdea} = attrs
	var {thank} = attrs

	var headerButtonStyle = serializeStyle({
		"border-color": school.foreground_color,
		color: school.foreground_color
	})

	return <SchoolPage page="budget" req={attrs.req} school={school}>
		<script src="/assets/html5.js" />
		<script src="/assets/hwcrypto.js" />

		<SchoolHeader school={school}>
			<a href={Paths.schoolPath(school)} class="context">{school.name}</a>
			<h1>{budget.title}</h1>

			{roles.includes("teacher") ? <menu>
				<a
					href={Paths.updateBudgetPath(school, budget)}
					style={headerButtonStyle}
				>
					Muuda hääletust
				</a>

				<a
					href={Paths.paperVotesPath(school, budget)}
					style={headerButtonStyle}
				>
					Muuda paberhääli
				</a>
			</menu> : null}
		</SchoolHeader>

		{budget.description ? <Section>
			<p id="budget-description" class="section-paragraph">
				{Jsx.html(linkify(budget.description))}
			</p>
		</Section> : null}

		{function() {
			if (
				budget.voting_starts_at && new Date >= budget.voting_starts_at &&
				(budget.voting_ends_at == null || new Date < budget.voting_ends_at)
			) return <VotingSection
				req={req}
				school={school}
				budget={budget}
				roles={roles}
				ideas={ideas}
				votesByIdea={votesByIdea}
				thank={thank}
			/>

			if (
				budget.voting_ends_at && new Date >= budget.voting_ends_at
			) return <ResultsSection
				req={req}
				school={school}
				budget={budget}
				ideas={ideas}
				votesByIdea={votesByIdea}
			/>

			return <IdeasSection
				req={req}
				school={school}
				budget={budget}
				ideas={ideas}
				roles={roles}
			/>
		}()}
	</SchoolPage>
}

function IdeasSection(attrs) {
	var {school} = attrs
	var {budget} = attrs
	var {roles} = attrs
	var {ideas} = attrs

	return <Section id="viewable-ideas-section">
		<Heading>Ideed</Heading>

		{budget.voting_starts_at ? <p class="section-paragraph">
			Ideid saad esitada kuni hääletamise alguseni ehk
			kuni <DateElement at={budget.voting_starts_at} />.
		</p> : null}

		{(
			(roles.includes("teacher") || roles.includes("voter")) &&
			(budget.voting_starts_at == null || new Date < budget.voting_starts_at)
		) ? <menu>
			<SchoolButton
				school={school}
				href={Paths.createIdeaPath(school, budget)}
			>
				Esita uus idee
			</SchoolButton>
		</menu> : null}

		<ul id="ideas">{ideas.map(function(idea) {
			return <li class="idea">
				<h3 class="idea-title">
					<a href={Paths.ideaPath(school, idea)}>{idea.title}</a>
				</h3>

				<span class="idea-author-names">{idea.author_names}</span>
			</li>
		})}</ul>
	</Section>
}

function VotingSection(attrs) {
	var {req} = attrs
	var {account} = req
	var {school} = attrs
	var {budget} = attrs
	var {ideas} = attrs
	var {roles} = attrs
	var {votesByIdea} = attrs
	var {thank} = attrs
	var maxVoteCount = _.max(_.values(votesByIdea))

	return <Section id="votable-ideas-section">
		<Heading>Ideed</Heading>

		{thank ? <p id="thanks" class="section-paragraph">
			Aitäh hääletamast!
		</p> : null}

		<p class="section-paragraph">
			Hääleta meelepärasele ideele. Anda saad vaid ühe hääle, nii et kaks korda
			hääletades jääb kehtima vaid viimane hääl.

			{budget.voting_starts_at ? <span>
				{" "}Hääletamine algas <DateElement at={budget.voting_starts_at} />.
			</span> : null}

			{budget.voting_ends_at ? <span>
				{" "}Hääletada saad
				kuni <DateElement at={DateFns.addDays(budget.voting_ends_at, -1)} /> kl
				23:59.
			</span> : null}

			{roles.includes("teacher") ? <span>
				{" "}Häälte arv on hääletamise ajal nähtav vaid sulle kui õpetajale.
			</span> : null}
		</p>

		<Form
			id="voting-form"
			req={req}
			action={Paths.votesPath(school, budget)}
			method="post"
		>
			<ul id="ideas">{ideas.map(function(idea) {
				var voteCount = votesByIdea[idea.id] || 0

				return <li class="idea">
					<input
						id={`idea-${idea.id}-checkbox`}
						type="radio"
						name="idea_id"
						value={idea.id}
						required
					/>

					<label for={`idea-${idea.id}-checkbox`}>
						<h3 class="idea-title">
							<a href={Paths.ideaPath(school, idea)}>{idea.title}</a>
						</h3>

						{roles.includes("teacher") ?
							<VoteCountView count={voteCount} max={maxVoteCount} />
						: null}

						<span class="idea-author-names">{idea.author_names}</span>
					</label>
				</li>
			})}</ul>

		{thank ? <p class="section-paragraph">
			Aitäh hääletamast! Kui soovid oma häält muuta või lubada sõbral ka sama seadmega hääletada, vali ülalt idee ning allkirjasta hääl.
		</p> : <p class="section-paragraph">
			Hääletamiseks pead andma digiallkirja. Vali ülalt lemmikidee ja hääleta kas Id-kaardi, Mobiil-Id või Smart-Id abiga.
		</p>}

			<EidView
				req={req}
				formId="voting-form"
				action="sign"
				pending="Hääletan…"
				submit="Hääleta"
				personalId={account && account.personal_id}
			/>
		</Form>
	</Section>
}

function ResultsSection(attrs) {
	var {school} = attrs
	var {budget} = attrs
	var {ideas} = attrs
	var {votesByIdea} = attrs
	var maxVoteCount = _.max(_.values(votesByIdea))
	var voteCount = _.sum(_.values(votesByIdea))
	ideas = _.sortBy(ideas, (idea) => votesByIdea[idea.id] || 0).reverse()

	return <Section id="voted-ideas-section">
		<Heading>Ideed</Heading>

		<p class="section-paragraph">
			Hääletamine lõppes <DateElement
			at={DateFns.addDays(budget.voting_ends_at, -1)} /> kl 23:59.
			Kokku anti {voteCount} {_.plural(voteCount, "hääl", "häält")}.
		</p>

		<ul id="ideas">{ideas.map(function(idea) {
			var voteCount = votesByIdea[idea.id] || 0

			return <li class="idea">
				<h3 class="idea-title">
					<a href={Paths.ideaPath(school, idea)}>{idea.title}</a>
				</h3>

				<VoteCountView count={voteCount} max={maxVoteCount} />
				<span class="idea-author-names">{idea.author_names}</span>
			</li>
		})}</ul>
	</Section>
}

function VoteCountView(attrs) {
	var {count} = attrs
	var {max} = attrs

	return <span class="idea-vote-count">
		{count > 0 ? <progress value={count} max={max} /> : null}

		<span class="count">
			{count}
			{" "}
			{_.plural(count, "hääl", "häält")}
		</span>
	</span>
}
