/** @jsx Jsx */
var Jsx = require("j6pack")
var Page = require("./page")
var {Section} = Page
var {Centered} = Page
var {Heading} = Page
exports = module.exports = IndexPage
exports.HeroHeader = HeroHeader

function IndexPage(attrs) {
	var {req} = attrs
	var {schools} = attrs
	var schoolsPath = req.baseUrl + "/schools"

	return <Page
		page="home"
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

				<a href="/help" class="cyan-button">
					Tutvu õppevahenditega
				</a>
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
		</Section>

		<Section id="schools-section">
			<Heading>Osalevad koolid</Heading>

			<ul id="schools">{schools.map(function(school) {
				return <li>
					<a href={schoolsPath + "/" + school.id}>{school.name}</a>
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
