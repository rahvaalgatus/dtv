/** @jsx Jsx */
var Jsx = require("j6pack")
var Page = require("../../page")
var {SchoolPage} = require("../read_page")
var {SchoolHeader} = require("../read_page")
var {Section} = Page
var {serializeStyle} = Page
var linkify = require("root/lib/linkify")

module.exports = function(attrs) {
	var {req} = attrs
	var {account} = req
	var {school} = attrs
	var {idea} = attrs
	var ideaPath = req.baseUrl + "/" + idea.id

	return <IdeaPage
		req={req}
		school={school}
		idea={idea}
		editable={
			account &&
			idea.account_id == account.id &&
			(school.voting_starts_at == null || new Date < school.voting_starts_at)
		}
	>
		<Section>
			<p id="idea-description" class="section-paragraph">
				{idea.image_type ? <a href={ideaPath + "/image"}>
					<img src={ideaPath + "/image"} />
				</a> : null}

				{Jsx.html(linkify(idea.description))}
			</p>
		</Section>
	</IdeaPage>
}

function IdeaPage(attrs, children) {
	var {school} = attrs
	var {idea} = attrs
	var {editable} = attrs
	var schoolPath = "/schools/" + school.id
	var ideaPath = schoolPath + "/ideas/" + idea.id

	var headerButtonStyle = serializeStyle({
		"border-color": school.foreground_color,
		color: school.foreground_color
	})

	return <SchoolPage
		page="idea"
		req={attrs.req}
		title={idea.title}
		school={school}
	>
		<SchoolHeader school={school}>
			<a href={schoolPath} class="context">{school.name}</a>
			<h1>{idea.title}</h1>
			<span class="subtitle author-names">{idea.author_names}</span>

			{editable ? <menu>
				<a href={`${ideaPath}/edit`} style={headerButtonStyle}>Muuda ideed</a>
			</menu> : null}
		</SchoolHeader>

		{children}
	</SchoolPage>
}
