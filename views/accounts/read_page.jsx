/** @jsx Jsx */
var Jsx = require("j6pack")
var Page = require("../page")
var {Header} = Page
var {Section} = Page
var {Form} = Page

module.exports = function({req, t, account}) {
	return <Page page="account" req={req} title={account.name}>
		<Header>
			<h1>{account.name}</h1>
			<p>{t("account_page.header.personal_id")}: {account.personal_id}</p>
		</Header>

		<Section>
			<Form
				action="/account"
				req={req}
				method="put"
				id="account-form"
				class="budget-form"
			>
				<label for="name" class="budget-field">
					<span class="label">{t("account_page.form.name_label")}</span>

					<input
						type="text"
						name="name"
						required
						class="budget-input"
						value={account.name}
					/>
				</label>

				<button type="submit">{t("account_page.form.update_button")}</button>
			</Form>
		</Section>
	</Page>
}
