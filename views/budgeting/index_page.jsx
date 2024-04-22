/** @jsx Jsx */
var Jsx = require("j6pack")
var Page = require("../page")
var Paths = require("root/lib/paths")
var {Section} = Page
var {Centered} = Page
var {Heading} = Page
exports = module.exports = IndexPage
exports.HeroHeader = HeroHeader

function IndexPage({req, t, schools}) {
	return <Page
		page="budgeting-home"
		req={req}
		title={t("budgeting_page.title")}
	>
		<HeroHeader title={t("budgeting_page.header.title")}>
			<p>{Jsx.html(t("budgeting_page.header.description"))}</p>

			<div class="call-to-actions">
				<a href="mailto:info@rahvaalgatus.ee" class="green-button">
					{t("budgeting_page.header.join_button")}
				</a>

				<a href="/eelarve/abi" class="cyan-button">
					{t("budgeting_page.header.read_button")}
				</a>
			</div>
		</HeroHeader>

		<Section id="intro-section">
			<p class="section-paragraph">
				{Jsx.html(t("budgeting_page.body.intro"))}
			</p>

			<div class="section-block benefits-list">
				<img src="/assets/list-icon.png" class="list-image" alt="" />

				<p class="section-paragraph">
					<strong>{t("budgeting_page.body.list_header")}</strong>
				</p>

				<ul class="section-list">
					{t("budgeting_page.body.list_items").split("\n").map((item) => <li>
						{item}
					</li>)}
				</ul>
			</div>

			<p class="section-paragraph">
				{Jsx.html(t("budgeting_page.body.outro"))}
			</p>

			<div class="supporter-logos">
				<a href="https://www.norden.ee">
					<img
						src="/assets/norden.svg"
						title="Põhjamaade Ministrite Nõukogu esindus Eestis"
						alt="Põhjamaade Ministrite Nõukogu esindus Eestis"
					/>
				</a>
				{" "}
				<a href="https://integratsioon.ee">
					<img
						src="/assets/integratsiooni-sihtasutus.svg"
						title="Integratsiooni sihtasutus"
						alt="Integratsiooni sihtasutus"
					/>
				</a>
				{" "}
				<a href="https://acf.ee">
					<img
						src="/assets/acf.svg"
						title="Aktiivsete Kodanike Fond"
						alt="Aktiivsete Kodanike Fond"
					/>
				</a>
				{" "}
				<a href="https://eeagentuur.ee">
					<img
						src="/assets/erasmus.svg"
						title="Erasmus+ ja Euroopa Solidaarsuskorpuse agentuur"
						alt="Erasmus+ ja Euroopa Solidaarsuskorpuse agentuur"
					/>
				</a>
				{" "}
				<img
					src="/assets/cofunded_by_eu.svg"
					title="Kaasrahastanud Euroopa Liit"
					alt="Kaasrahastanud Euroopa Liit"
				/>
			</div>
		</Section>

		<Section id="schools-section">
			<Heading>{t("budgeting_page.schools.title")}</Heading>

			<ul id="schools">{schools.map((school) => <li>
				<a href={Paths.schoolPath(school)}>{school.name}</a>
			</li>)}</ul>
		</Section>
	</Page>
}

function HeroHeader(attrs, children) {
	var {title} = attrs

	return <header id="header" class="hero">
		<Centered>
			<img src="/assets/book-cover.jpg" class="cover" alt="" />

			<h1>{title}</h1>

			{children}
		</Centered>
	</header>
}
