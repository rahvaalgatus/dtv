/** @jsx Jsx */
var Jsx = require("j6pack")
var Page = require("../page")
var {Header} = Page
var {Section} = Page

module.exports = function(attrs) {
	var {req} = attrs
	var {schools} = attrs
	var schoolsPath = req.baseUrl

	return <Page
		page="schools"
		req={attrs.req}
		title="Koolid"
	>
		<Header>
			<h1>Koolid</h1>
		</Header>

		<Section id="schools-section">
			<ul id="schools">{schools.map(function(school) {
				return <li>
					<a href={schoolsPath + "/" + school.id}>{school.name}</a>
				</li>
			})}</ul>
		</Section>
	</Page>
}
