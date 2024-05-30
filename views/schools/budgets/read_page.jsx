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

function ReadPage({req, t, l10n, school, budget, ideas, votesByIdea, thank}) {
	var {account} = req
	var {roles} = req

	var headerButtonStyle = serializeStyle({
		"border-color": school.foreground_color,
		color: school.foreground_color
	})

	return <SchoolPage page="budget" req={req} school={school}>
		<script src="/assets/html5.js" />
		<script src="/assets/hwcrypto.js" />

		<SchoolHeader school={school}>
			<a href={Paths.schoolPath(school)} class="context">{school.name}</a>
			<h1>{budget.title}</h1>

			{(
				roles.includes("teacher") &&
				budget.expired_at == null &&
				budget.anonymized_at == null
			) ? <menu>
				<a
					href={Paths.updateBudgetPath(school, budget)}
					style={headerButtonStyle}
				>
					{t("budget_page.menu.update_budget_button")}
				</a>

				<a
					href={Paths.paperVotesPath(school, budget)}
					style={headerButtonStyle}
				>
					{t("budget_page.menu.update_paper_votes_button")}
				</a>
			</menu> : null}
		</SchoolHeader>

		{budget.expired_at || budget.anonymized_at ? <Section>
			{budget.anonymized_at ? <p class="warning-paragraph section-paragraph">
				{t("budget_page.budget_anonymized")}
			</p> : <p class="warning-paragraph section-paragraph">
				{t("budget_page.budget_expired")}
			</p>}
		</Section> : null}

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
				l10n={l10n}
				account={account}
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
				l10n={l10n}
				req={req}
				account={account}
				school={school}
				budget={budget}
				ideas={ideas}
				votesByIdea={votesByIdea}
			/>

			return <IdeasSection
				account={account}
				l10n={l10n}
				school={school}
				budget={budget}
				ideas={ideas}
				roles={roles}
			/>
		}()}
	</SchoolPage>
}

function IdeasSection({l10n, account, school, budget, roles, ideas}) {
	var {t} = l10n

	return <Section id="viewable-ideas-section">
		<Heading>{t("budget_page.ideas.title")}</Heading>

		{budget.voting_starts_at ? <p class="section-paragraph">
			Ideid saad esitada kuni hääletamise alguseni ehk
			kuni <DateElement l10n={l10n} at={budget.voting_starts_at} />.
		</p> : null}

		{(
			(roles.includes("teacher") || roles.includes("voter")) &&
			(budget.voting_starts_at == null || new Date < budget.voting_starts_at)
		) ? <menu>
			<SchoolButton
				school={school}
				href={Paths.createIdeaPath(school, budget)}
			>
				{t("budget_page.ideas.create_button")}
			</SchoolButton>
		</menu> : null}

		<ul id="ideas">{ideas.map(function(idea) {
			return <li class="idea">
				<h3 class="idea-title">
					<a href={Paths.ideaPath(school, idea)}>{idea.title}</a>
				</h3>

				{account ? <span class="idea-author-names">
					{idea.author_names}
				</span> : null}
			</li>
		})}</ul>
	</Section>
}

function VotingSection({
	req,
	l10n,
	account,
	school,
	budget,
	ideas,
	roles,
	votesByIdea,
	thank
}) {
	var {t} = l10n
	var maxVoteCount = _.max(_.values(votesByIdea))

	return <Section id="votable-ideas-section">
		<Heading>{t("budget_page.voting.title")}</Heading>

		{thank ? <p id="thanks" class="section-paragraph">
			{t("budget_page.voting.voted")}
		</p> : null}

		<p class="section-paragraph">
			{t("budget_page.voting.description")}

			{budget.voting_starts_at ? <>
				{" "}
				{Jsx.html(t("budget_page.voting.started_on", {
					date: <DateElement
						l10n={l10n}
						at={budget.voting_starts_at}
					/>,

					time: "23:59"
				}))}
			</> : null}

			{budget.voting_ends_at ? <>
				{" "}
				{Jsx.html(t("budget_page.voting.ends_at", {
					date: <DateElement
						l10n={l10n}
						at={DateFns.addDays(budget.voting_ends_at, -1)}
					/>,

					time: "23:59"
				}))}
			</> : null}

			{roles.includes("teacher") ? <>
				{" "}{t("budget_page.voting.vote_count_only_for_teacher")}
			</> : null}
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
							<VoteCountView t={t} count={voteCount} max={maxVoteCount} />
						: null}

						{account ? <span class="idea-author-names">
							{idea.author_names}
						</span> : null}
					</label>
				</li>
			})}</ul>

		<p class="section-paragraph">{thank
			? t("budget_page.voting.vote_description_if_voted")
			: t("budget_page.voting.vote_description")
		}</p>

			<EidView
				req={req}
				formId="voting-form"
				action="sign"
				pending={t("budget_page.voting.vote_pending")}
				submit={t("budget_page.voting.vote_button")}
				personalId={account && account.personal_id}
			/>
		</Form>
	</Section>
}

function ResultsSection({l10n, account, school, budget, ideas, votesByIdea}) {
	var {t} = l10n
	var maxVoteCount = _.max(_.values(votesByIdea))
	var voteCount = _.sum(_.values(votesByIdea))
	ideas = _.sortBy(ideas, (idea) => votesByIdea[idea.id] || 0).reverse()

	return <Section id="voted-ideas-section">
		<Heading>{t("budget_page.results.title")}</Heading>

		<p class="section-paragraph">
			{Jsx.html(t("budget_page.results.ended_at", {
				date: <DateElement
					l10n={l10n}
					at={DateFns.addDays(budget.voting_ends_at, -1)}
				/>,

				time: "23:59"
			}))}
			{" "}
			{_.plural(voteCount,
				t("budget_page.results.total_1"),
				t("budget_page.results.total_n", {count: voteCount})
			)}
		</p>

		<ul id="ideas">{ideas.map(function(idea) {
			var voteCount = votesByIdea[idea.id] || 0

			return <li class="idea">
				<h3 class="idea-title">
					<a href={Paths.ideaPath(school, idea)}>{idea.title}</a>
				</h3>

				<VoteCountView t={t} count={voteCount} max={maxVoteCount} />

				{account ? <span class="idea-author-names">
					{idea.author_names}
				</span> : null}
			</li>
		})}</ul>
	</Section>
}

function VoteCountView({t, max, count}) {
	return <span class="idea-vote-count">
		{count > 0 ? <progress value={count} max={max} /> : null}

		<span class="count">{_.plural(
			count,
			t("budget_page.voting.1_vote"),
			t("budget_page.voting.n_vote", {count})
		)}</span>
	</span>
}
