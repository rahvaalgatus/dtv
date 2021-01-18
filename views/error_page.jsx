/** @jsx Jsx */
var Jsx = require("j6pack")
var Page = require("./page")
var {Header} = Page
var {Section} = Page

module.exports = function(attrs) {
	var {title} = attrs
	var {message} = attrs

	return <Page page="error" req={attrs.req} title="Vabandust!">
		<Header>
			<h1>{title || "Vabandust!"}</h1>
		</Header>

		<Section>
			{message ? <p class="section-paragraph description">
				{message}
			</p> : null}
		</Section>
	</Page>
}
