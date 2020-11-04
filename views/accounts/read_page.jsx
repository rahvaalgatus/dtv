/** @jsx Jsx */
var Jsx = require("j6pack")
var Page = require("../page")
var {Header} = Page
var {Section} = Page
var {Form} = Page

module.exports = function(attrs) {
	var {req} = attrs
	var {account} = attrs

	return <Page
		page="account"
		req={attrs.req}
		title={account.name}
	>
		<Header>
			<h1>{account.name}</h1>
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
					<span class="label">Nimi</span>

					<input
						type="text"
						name="name"
						required
						class="budget-input"
						value={account.name}
					/>
				</label>

				<button type="submit">Muuda</button>
			</Form>
		</Section>
	</Page>
}
