/** @jsx Jsx */
var Jsx = require("j6pack")
var Page = require("../page")
var Config = require("root/config")
var {Header} = Page
var {Section} = Page
var {Form} = Page
var EidView = require("../eid_view")

module.exports = function({req, t}) {
	return <Page
		page="create-session"
		req={req}
		title={t("create_session_page.title")}
	>
		<script src="/assets/html5.js" />
		<script src="/assets/hwcrypto.js" />

		<Header>
			<h1>{t("create_session_page.title")}</h1>
		</Header>

		<Section>
			<p class="section-paragraph">
				{t("create_session_page.description")}
			</p>

			<Form
				req={req}
				action={req.baseUrl}
				method="post"
				id="authentication-form"
			>
				<EidView
					req={req}
					formId="authentication-form"
					action="auth"
					idCardAuthenticationUrl={Config.idCardAuthenticationUrl + req.baseUrl}
					submit={t("create_session_page.eid_view.submit_button")}
					pending={t("create_session_page.eid_view.submitting")}
				/>
			</Form>
		</Section>
	</Page>
}
