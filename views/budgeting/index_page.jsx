/** @jsx Jsx */
var Jsx = require("j6pack")
var Page = require("../page")
var Paths = require("root/lib/paths")
var {Section} = Page
var {Centered} = Page
var {Heading} = Page
exports = module.exports = IndexPage
exports.HeroHeader = HeroHeader

function IndexPage(attrs) {
	var {req} = attrs
	var {schools} = attrs

	return <Page
		page="budgeting-home"
		req={req}
		title="Kaasav Kool"
	>
		<HeroHeader title="Koolide kaasav eelarve">
			<p>
				Ühingu <a class="link-button" href="https://www.transparency.ee">MTÜ Korruptsioonivaba Eesti</a> ning <a class="link-button" href="https://kogu.ee">SA Eesti Koostöö Kogu</a> algatatud kaasava eelarvestamise projekt koolides on esimene laiaulatuslikum ettevõtmine Eestis, kus kohalike omavalitsuste kaasava eelarvestamise eeskujul saavad õpilased välja töötada, arendada ja esitleda ideesid, mille vahel kooli kogukond valib kõige sobilikuma viisi eelarve kasutamiseks.
			</p>

			<div class="call-to-actions">
				<a href="mailto:info@rahvaalgatus.ee" class="green-button">
					Ühine programmiga
				</a>

				<a href="/eelarve/abi" class="cyan-button">Tutvu õppevahenditega</a>
			</div>
		</HeroHeader>

		<Section id="intro-section">
			<p class="section-paragraph">
				Käesoleva lehe puhul on tegemist koolidele loodud keskkonnaga, kus õpilased saavad digitaalselt ettepanekuid esitada ja nende üle kaasaegseid e-vahendeid kasutades demokraatlikult hääletada.
			</p>

			<p class="section-paragraph">
				Ettevõtmise eesmärk on suurendada õpilaste teadlikkust demokraatlikest otsustusprotsessidest ning aktiveerida neid koolielus kaasa rääkima.
			</p>

			<div class="section-block benefits-list">
				<img src="/assets/list-icon.png" class="list-image" alt="" />

				<p class="section-paragraph">
					<strong>Projekti kaudu saavad õpilased osa:</strong>
				</p>

				<ul class="section-list">
					<li>avatud (kooli)valitsemisest;</li>
					<li>kogukonnana otsustamisest ja enda elu puudutavates otsustes osalemisest;</li>
					<li>vajalike digipädevuste arendamisest.</li>
				</ul>
			</div>

			<p class="section-paragraph">
				Eesmärk on, et õpilased lihtsalt ei õpiks koolis teoreetiliselt, mis on demokraatia, vaid saaksid ka päriselulise kaasa rääkimise ja koos otsustamise kogemuse. See loob eeldused tugevama kogukonna ja kodanikuühiskonna arenguks.
			</p>

			<p class="section-paragraph">
				Koolide kaasavat eelarvestamist veavad eest <a href="https://kogu.ee">Eesti Koostöö Kogu</a> ja <a href="https://transparency.ee">Korruptsioonivaba Eesti</a>. Oma õla projektirahastajatena on alla pannud <a href="https://www.norden.ee">Põhjamaade Ministrite Nõukogu</a> (2020/21), <a href="https://integratsioon.ee">Integratsiooni SA</a> (2021 sügis), <a href="https://acf.ee">Aktiivsete Kodanike Fond</a> (2021 sügis-2023 juuni) ning <a href="https://eeagentuur.ee">Erasmus+ ja Euroopa Solidaarsuskorpuse agentuur</a> Erasmus+ programmist (2023 juuni-2024 juuni).
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
			</div>
		</Section>

		<Section id="schools-section">
			<Heading>Osalevad koolid</Heading>

			<ul id="schools">{schools.map(function(school) {
				return <li>
					<a href={Paths.schoolPath(school)}>{school.name}</a>
				</li>
			})}</ul>
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
