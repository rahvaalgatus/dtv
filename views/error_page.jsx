/** @jsx Jsx */
var Jsx = require("j6pack")
var Page = require("./page")
var {Header} = Page
var {Section} = Page

module.exports = function(attrs) {
	var title = attrs.title || "Vabandust!"
	var {message} = attrs

	return <Page page="error" req={attrs.req} title={title}>
		<Header>
			<h1>{title}</h1>
		</Header>

		<Section>
			{message ? <p class="section-paragraph description">
				{message}
			</p> : null}
		</Section>
	</Page>
}
