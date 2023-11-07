/** @jsx Jsx */
var Jsx = require("j6pack")
var Page = require("./page")
var {Section} = Page
var {Heading} = Page
var {Centered} = Page
module.exports = IndexPage

function IndexPage(attrs) {
	var {req} = attrs
	var {t} = req

	return <Page
		page="home"
		req={req}
		title={t("home_page.title")}
		homeless
	>
		<header id="header">
			<Centered>
				<h1>
					<img src="/assets/logo.svg" alt={t("nav.home")} class="logo" />
					<span class="subtitle">{t("home_page.subtitle")}</span>
				</h1>


				<div class="call-to-actions">
					<Heading>{t("home_page.header.buttons_title")}</Heading>

					<img
						src="/assets/home-illustration.png"
						alt=""
						class="illustration"
					/>

					<ul>
						<li>
							<a class="yellow-button" href="/eelarve">
								{t("home_page.header.budgets_button")}
							</a>
						</li>

						<li>
							<a class="yellow-button" href="https://vali.rahvaalgatus.ee">
								{t("home_page.header.elections_button")}
							</a>
						</li>

						<li>
							<a
								class="yellow-button"
								href="https://rahvaalgatus.ee/digiallkiri"
							>
								{t("home_page.header.signing_button")}
							</a>
						</li>
					</ul>
				</div>
			</Centered>
		</header>

		<Section>
			<p class="section-paragraph">{t("home_page.text")}</p>
		</Section>

		<Section id="exercises-section" wide>
			<Heading>{t("home_page.exercises.title")}</Heading>

			<ul>
				<li class="exercise">
					<a class="yellow-button budgeting-button" href="/eelarve">
						{t("home_page.exercises.budgets_button")}
					</a>

					<p class="section-paragraph">
						{t("home_page.exercises.budgets_description")}
					</p>
				</li>

				<li class="exercise">
					<a
						class="yellow-button election-button"
						href="https://vali.rahvaalgatus.ee"
					>
						{t("home_page.exercises.elections_button")}
					</a>

					<p class="section-paragraph">
						{t("home_page.exercises.elections_description")}
					</p>
				</li>

				<li class="exercise">
					<a
						class="yellow-button signing-button"
						href="https://rahvaalgatus.ee/digiallkiri"
					>
						{t("home_page.exercises.signing_button")}
					</a>

					<p class="section-paragraph">
						{t("home_page.exercises.signing_description")}
					</p>
				</li>
			</ul>
		</Section>
	</Page>
}
