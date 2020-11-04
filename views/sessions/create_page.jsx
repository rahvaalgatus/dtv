/** @jsx Jsx */
var Jsx = require("j6pack")
var Page = require("../page")
var {Header} = Page
var {Section} = Page
var {Form} = Page
var EidView = require("../eid_view")

module.exports = function(attrs) {
	var {req} = attrs

	return <Page
		page="create-session"
		req={attrs.req}
		title="Logi sisse"
	>
		<Header>
			<h1>Logi sisse</h1>
		</Header>

		<Section>
			<p class="section-paragraph">
				Sisselogimiseks vali autentimismeetod.
			</p>

			<Form req={req} action={req.baseUrl} id="authentication-form">
				<EidView
					req={req}
					formId="authentication-form"
					pending="Login sisse…"
					submit="Logi sisse"
					withIdCard={false}
				/>
			</Form>
		</Section>
	</Page>
}
